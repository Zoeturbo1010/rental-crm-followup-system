import test from "node:test";
import assert from "node:assert/strict";
import {transition,reminders,defaultRules,dealStatus,localInput,migrateLegacy,phase,rangeBounds,funnelCounts,iso} from "../app/crm-domain.ts";

const NOW=Date.parse("2026-10-17T10:00:00+08:00");
const time=h=>new Date(NOW+h*3600000).toISOString();
const person=(id="a")=>({id,name:`测试客户${id}`,phone:id==="a"?"13800009901":"13800009902",source:"手动录入",owner:"林晓",area:"望京",budget:"5000–6000",moveIn:"一个月内",stage:"待跟进",viewed:false,intent:"中意向",tags:[],last:"待首次沟通"});
const empty=()=>({version:3,clients:[],entries:[],tasks:[],viewings:[],deals:[],properties:[{id:"p",name:"测试房源",area:"望京",rent:5600,rooms:"一居",status:"可租",tags:[]}],rules:{...defaultRules}});
const run=(s,a,t=NOW)=>transition(s,a,t);
const added=()=>run(empty(),{type:"addClient",client:person(),nextAt:time(1)});
const follow=(s,result="已联系，等待反馈",t=NOW)=>run(s,{type:"followup",clientId:"a",input:{content:"确认需求和预算",result,nextAt:time(24),intent:"高意向",channel:"企微",tags:["首响超时","跟进超时"],phase:"看房前"}},t);
const book=s=>run(s,{type:"book",viewing:{id:"v",clientId:"a",propertyId:"p",property:"测试房源",at:time(3),agent:"林晓",meeting:"楼下",status:"待确认"}});

test("新增→跟进→推荐→预约→确认→带看→回访→成交→部分/全额结算保持关联",()=>{
 let s=added();assert.equal(s.clients[0].stage,"待跟进");assert.equal(s.tasks.filter(t=>t.status==="pending").length,1);assert.equal(s.entries.length,1);
 s=follow(s);assert.equal(s.clients[0].stage,"待推荐");assert.equal(s.entries.filter(e=>e.kind==="followup").length,1);assert.equal(s.tasks.filter(t=>t.status==="pending").length,1);
 s=run(s,{type:"recommend",clientId:"a",propertyIds:["p"],content:"近地铁符合预算",nextAt:time(12)});assert.equal(s.entries[0].kind,"recommendation");assert.deepEqual(s.entries[0].propertyIds,["p"]);
 s=book(s);assert.equal(s.clients[0].stage,"待看房");assert.equal(s.tasks.filter(t=>t.status==="pending").length,0);assert.equal(s.viewings[0].propertyId,"p");
 s=run(s,{type:"confirmViewing",id:"v"});s=run(s,{type:"completeViewing",id:"v",feedback:"客户满意，考虑签约",nextAt:time(6)},NOW+4*3600000);assert.equal(s.clients[0].viewed,true);assert.equal(s.clients[0].stage,"待推荐");assert.equal(s.tasks.find(t=>t.status==="pending").kind,"callback");
 s=follow(s,"回访满意准备签约",NOW+4.5*3600000);assert.equal(s.tasks.filter(t=>t.kind==="callback"&&t.status==="pending").length,0);assert.equal(s.entries.filter(e=>e.kind==="followup").length,2);
 const d={id:"d",clientId:"a",propertyId:"p",property:"测试房源",rent:5600,commission:2800,received:0,at:time(5),owner:"林晓",channel:"转介绍",note:"真实填写金额"};s=run(s,{type:"saveDeal",deal:d,editing:false},NOW+5*3600000);assert.equal(s.deals[0].rent,5600);assert.equal(s.deals[0].commission,2800);assert.equal(s.clients[0].stage,"已成交");assert.equal(s.properties[0].status,"已租");assert.equal(s.tasks.filter(t=>t.status==="pending").length,0);
 s=run(s,{type:"saveDeal",deal:{...d,received:1500},editing:true},NOW+6*3600000);assert.equal(s.deals.length,1);assert.equal(dealStatus(s.deals[0]),"部分结算");s=run(s,{type:"saveDeal",deal:{...d,received:2800},editing:true},NOW+7*3600000);assert.equal(dealStatus(s.deals[0]),"已结算");assert.equal(s.deals.length,1);assert.equal(reminders(s,NOW+30*3600000).length,0);
});
test("重复电话、过去日期与空白内容不能生成业务记录",()=>{
 const s=added();assert.throws(()=>run(s,{type:"addClient",client:{...person("b"),phone:person().phone},nextAt:time(2)}),/已存在/);assert.throws(()=>run(empty(),{type:"addClient",client:person(),nextAt:time(-1)}),/晚于/);assert.throws(()=>run(s,{type:"followup",clientId:"a",input:{content:" ",result:"已联系",nextAt:time(1),tags:[],intent:"中意向",channel:"企微",phase:"看房前"}}),/沟通内容/);assert.equal(s.entries.length,1);
});
test("超时任务由真实时间触发；处理后旧提醒消失，下一次到期再触发",()=>{
 let s=added();assert.equal(reminders(s,NOW).length,0);assert.equal(reminders(s,NOW+2*3600000).length,1);const old=reminders(s,NOW+2*3600000)[0].id;s=follow(s,"已联系",NOW+2*3600000);assert.equal(reminders(s,NOW+2*3600000).length,0);assert.equal(reminders(s,NOW+25*3600000).length,1);assert.notEqual(reminders(s,NOW+25*3600000)[0].id,old);assert.ok(!s.clients[0].tags.includes("跟进超时"));
});
test("普通跟进保持有效预约，不把待看房错误改回待推荐",()=>{
 let s=book(follow(added()));s=follow(s);assert.equal(s.clients[0].stage,"待看房");assert.equal(s.viewings[0].status,"待确认");assert.equal(s.viewings[0].at,time(3));assert.equal(s.clients[0].viewed,false);
});
test("跟进中选择待预约不提前冒充已预约",()=>{
 const s=follow(added(),"客户有意向，待预约看房");assert.equal(s.clients[0].stage,"待推荐");assert.equal(s.viewings.length,0);
});
test("预约确认、改期与取消对提醒、状态及已看房事实正确联动",()=>{
 let s=book(follow(added()));assert.equal(reminders(s,NOW+2*3600000).length,1);s=run(s,{type:"confirmViewing",id:"v"});assert.equal(reminders(s,NOW+2*3600000).length,0);s=run(s,{type:"reschedule",id:"v",at:time(12),agent:"王磊",meeting:"新地点"});assert.equal(s.viewings[0].status,"待确认");assert.equal(reminders(s,NOW+2*3600000).length,0);s=run(s,{type:"cancelViewing",id:"v",reason:"客户临时有事",nextAt:time(24)});assert.equal(s.clients[0].stage,"待推荐");assert.equal(s.clients[0].viewed,false);assert.equal(s.viewings[0].status,"已取消");assert.equal(reminders(s,NOW+13*3600000).length,0);assert.equal(s.tasks.filter(t=>t.status==="pending").length,1);
});
test("预约不能提前完成，不能跳过确认；回访不重复完成带看",()=>{
 let s=book(added());assert.throws(()=>run(s,{type:"completeViewing",id:"v",feedback:"满意",nextAt:time(5)},NOW+4*3600000),/先确认/);s=run(s,{type:"confirmViewing",id:"v"});assert.throws(()=>run(s,{type:"completeViewing",id:"v",feedback:"满意",nextAt:time(5)}),/尚未开始/);s=run(s,{type:"completeViewing",id:"v",feedback:"满意",nextAt:time(5)},NOW+4*3600000);assert.throws(()=>run(s,{type:"completeViewing",id:"v",feedback:"重复",nextAt:time(6)},NOW+5*3600000),/先确认/);
});
test("带看人或客户前后一小时有预约时阻止冲突",()=>{
 let s=book(added());s=run(s,{type:"addClient",client:person("b"),nextAt:time(2)});assert.throws(()=>run(s,{type:"book",viewing:{...s.viewings[0],id:"v2",clientId:"b",at:time(3.5)}}),/已有预约/);assert.equal(s.viewings.length,1);
});
test("别处成交记为流失，关闭任务和预约，不生成本平台成交",()=>{
 const s=follow(book(added()),"别处成交");assert.equal(s.clients[0].stage,"已流失");assert.equal(s.viewings[0].status,"已取消");assert.equal(s.deals.length,0);assert.equal(s.tasks.filter(t=>t.status==="pending").length,0);assert.equal(reminders(s,NOW+48*3600000).length,0);const reopened=run(s,{type:"reopen",clientId:"a",nextAt:time(24)});assert.equal(reopened.clients[0].stage,"待推荐");assert.equal(reopened.tasks.filter(t=>t.status==="pending").length,1);
});
test("成交拒绝未看房、重复成交和超收金额",()=>{
 const d={id:"d",clientId:"a",property:"测试房源",rent:1,commission:10,received:0,at:time(0),owner:"林晓",channel:"私域",note:""};const s=added();assert.throws(()=>run(s,{type:"saveDeal",deal:d,editing:false}),/先完成带看/);s.clients[0].viewed=true;const done=run(s,{type:"saveDeal",deal:d,editing:false});assert.throws(()=>run(done,{type:"saveDeal",deal:{...d,id:"d2"},editing:false}),/已有成交/);assert.throws(()=>run(done,{type:"saveDeal",deal:{...d,received:11},editing:true}),/不能超过/);
});
test("提醒规则保存后过滤对应通知，业务任务仍保留",()=>{
 let s=added();s=run(s,{type:"rules",rules:{...defaultRules,first:false}});assert.equal(reminders(s,NOW+2*3600000).length,0);assert.equal(s.tasks.filter(t=>t.status==="pending").length,1);assert.equal(JSON.parse(JSON.stringify(s)).rules.first,false);
});
test("已成交客户支持独立售后关怀，不降级，不重开售前任务",()=>{
 let s=added();s.clients[0].viewed=true;s=run(s,{type:"saveDeal",editing:false,deal:{id:"d",clientId:"a",property:"外部房源",rent:6000,commission:3000,received:3000,at:time(0),owner:"林晓",channel:"私域",note:""}});s=follow(s,"入住回访");assert.equal(s.clients[0].stage,"已成交");assert.equal(phase(s.clients[0]),"成交后");assert.equal(s.tasks.find(t=>t.status==="pending").kind,"aftercare");assert.equal(reminders(s,NOW+25*3600000).length,1);
});
test("本地时间控件不因 UTC 转换出现八小时时差",()=>{assert.equal(localInput("2026-10-17T02:00:00Z"),"2026-10-17T10:00");});
test("历史迁移保留跟进内容，补关联孤立成交，不伪造未知历史日期",()=>{
 const raw={clients:[{id:1,name:"测试",phone:"123456",stage:"待跟进",next:"明天 10:00",tags:["首响超时"],viewed:false}],followUps:{1:[{title:"林晓 · 跟进记录",desc:"客户明确预算",time:"刚刚",kind:"followup"}]},deals:[{id:"old",clientId:0,clientName:"历史客户",rent:"¥6,500/月",commission:"¥3,000",status:"已结算",date:"7月28日"}]};const s=migrateLegacy(raw,empty(),NOW);assert.equal(s.clients.find(c=>c.id==="1").stage,"待推荐");assert.equal(s.entries[0].content,"客户明确预算");assert.equal(s.entries[0].at,undefined);assert.equal(s.deals[0].rent,6500);assert.equal(s.deals[0].received,3000);assert.equal(s.deals[0].at,"");assert.ok(s.clients.some(c=>c.id===s.deals[0].clientId));assert.ok(!s.clients[0].tags.includes("首响超时"));
});
test("迁移后的有效预约与已成交状态优先于旧文本标签",()=>{
 const raw={clients:[{id:1,name:"a",stage:"待跟进",tags:[],phone:"123456"}],appointments:[{id:1,clientId:1,time:"明天 10:00",property:"测试房源",status:"待确认"}],followUps:{1:[{title:"跟进",desc:"需求",kind:"followup"}]}};const s=migrateLegacy(raw,empty(),NOW);assert.equal(s.clients[0].stage,"待看房");assert.equal(s.tasks.length,0);
});
test("时段筛选按北京时间真实划分周、月、季度、自定义日边界",()=>{
 assert.deepEqual(rangeBounds("本周","","",NOW),[Date.parse("2026-10-12T00:00:00+08:00"),Date.parse("2026-10-17T23:59:59.999+08:00")]);
 assert.equal(rangeBounds("本月","","",NOW)[0],Date.parse("2026-10-01T00:00:00+08:00"));assert.equal(rangeBounds("本季度","","",NOW)[0],Date.parse("2026-10-01T00:00:00+08:00"));assert.equal(rangeBounds("本年","","",NOW)[0],Date.parse("2026-01-01T00:00:00+08:00"));
 const [start,end]=rangeBounds("自定义","2026-10-16","2026-10-16",NOW);assert.equal(start,Date.parse("2026-10-16T00:00:00+08:00"));assert.equal(end-start,86400000-1);assert.ok(Number.isNaN(rangeBounds("自定义","","",NOW)[0]));assert.equal(iso("2026-10-17T10:00"),"2026-10-17T02:00:00.000Z");
});
test("补录历史看房不会使漏斗上下游倒挂；旧成交关联客户后去重",()=>{
 let s=added();s.clients[0].viewed=true;let m=funnelCounts(s,s.clients);assert.equal(m.contacted.size,1);assert.equal(m.recommended.size,1);assert.equal(m.appointed.size,1);assert.equal(m.viewed.size,1);assert.equal(m.closed.size,0);s=run(s,{type:"saveDeal",editing:false,deal:{id:"d",clientId:"a",property:"外部",rent:5000,commission:1000,received:0,at:time(0),owner:"林晓",channel:"私域",note:""}});s.deals.push({...s.deals[0],id:"legacyduplicate"});m=funnelCounts(s,s.clients);assert.equal(m.closed.size,1);assert.equal(funnelCounts(s,[]).closed.size,0);
});
test("编辑档案不会伪造人工跟进或改变阶段，已有完成带看不能改回未看房",()=>{
 let s=added();s=run(s,{type:"editClient",client:{...s.clients[0],area:"海淀",intent:"高意向",tags:["高意向"]}});assert.equal(s.clients[0].stage,"待跟进");assert.equal(s.entries.filter(e=>e.kind==="followup").length,0);s=book(s);s=run(s,{type:"confirmViewing",id:"v"});s=run(s,{type:"completeViewing",id:"v",feedback:"满意",nextAt:time(6)},NOW+4*3600000);assert.throws(()=>run(s,{type:"editClient",client:{...s.clients[0],viewed:false}}),/不能改回未看房/);
});
test("同一房源成交后关闭其他客户的关联预约，并恢复其重新匹配任务",()=>{
 let s=added();s.clients[0].viewed=true;s=run(s,{type:"addClient",client:person("b"),nextAt:time(2)});s=run(s,{type:"book",viewing:{id:"other-viewing",clientId:"b",propertyId:"p",property:"测试房源",at:time(6),agent:"王磊",meeting:"楼下",status:"待确认"}});s=run(s,{type:"saveDeal",editing:false,deal:{id:"d",clientId:"a",propertyId:"p",property:"测试房源",rent:5600,commission:2800,received:0,at:time(0),owner:"林晓",channel:"私域",note:""}});assert.equal(s.viewings[0].status,"已取消");assert.equal(s.clients.find(c=>c.id==="b").stage,"待推荐");assert.equal(s.tasks.filter(t=>t.clientId==="b"&&t.status==="pending").length,1);assert.ok(s.entries.some(e=>e.clientId==="b"&&e.title==="房源变更取消预约"));
});
