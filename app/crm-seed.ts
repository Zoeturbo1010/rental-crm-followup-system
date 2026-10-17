import {defaultRules,localInput,type State,type Client} from "./crm-domain";
export function createDemo(now=Date.now()):State {
 const ago=(h:number)=>new Date(now-h*3600000).toISOString();const later=(h:number)=>new Date(now+h*3600000).toISOString();
 const base={source:"私域添加",owner:"林晓",moveIn:"一个月内",intent:"中意向",tags:["已加企微"],updatedAt:ago(1)};
 const clients:Client[]=[
 {...base,id:"c1",name:"张雨晴",phone:"13800002681",stage:"待跟进",viewed:false,area:"朝阳 · 望京",budget:"5000–6000",last:"新客户咨询一居室，等待首次沟通",createdAt:ago(26)},
 {...base,id:"c2",name:"陈浩然",phone:"18600005708",stage:"待推荐",viewed:false,area:"海淀 · 中关村",budget:"6000–7500",last:"已确认整租一居需求，准备推荐房源",createdAt:ago(80)},
 {...base,id:"c3",name:"李思琪",phone:"13900008372",stage:"待推荐",viewed:false,owner:"王磊",area:"朝阳 · 三里屯",budget:"7000–9000",intent:"高意向",last:"已发送房源，等待客户反馈",createdAt:ago(120)},
 {...base,id:"c4",name:"周先生",phone:"15500001209",stage:"待看房",viewed:false,area:"西城 · 金融街",budget:"8000–10000",last:"远洋新干线看房预约等待确认",createdAt:ago(160)},
 {...base,id:"c5",name:"赵小姐",phone:"13300005162",stage:"待推荐",viewed:true,owner:"王磊",area:"朝阳 · 双井",budget:"5500–6500",tags:["已加企微","房子不合适"],last:"已看房，客户对采光有顾虑，待回访",createdAt:ago(200)},
 {...base,id:"c6",name:"吴天宇",phone:"18700003168",stage:"待推荐",viewed:true,area:"通州 · 北苑",budget:"4000–5000",tags:["已加企微","预算不匹配"],last:"希望在预算内重新匹配通勤房源",createdAt:ago(240)},
 {...base,id:"c7",name:"刘嘉",phone:"13600009428",stage:"已成交",viewed:true,owner:"王磊",area:"朝阳 · CBD",budget:"9000–11000",intent:"高意向",last:"已签约，待佣金结算",createdAt:ago(280)},
 ];
 const s:State={version:3,clients,properties:[
 {id:"p1",name:"望京西园 · 2号楼 601",area:"朝阳 · 望京",rent:5800,rooms:"一室一厅 · 58㎡",status:"可租",tags:["近地铁","整租"]},
 {id:"p2",name:"中关村公馆 · B座 1208",area:"海淀 · 中关村",rent:6800,rooms:"一室一厅 · 65㎡",status:"可租",tags:["通勤便利","精装修"]},
 {id:"p3",name:"远洋新干线 · A座 1208",area:"朝阳 · 三元桥",rent:8200,rooms:"两室一厅 · 88㎡",status:"可租",tags:["电梯","近地铁"]},
 {id:"p4",name:"国贸景苑 · 1号楼 508",area:"朝阳 · CBD",rent:9800,rooms:"两室一厅 · 96㎡",status:"已租",tags:["已签约"]},
 {id:"p5",name:"双井新苑 · 3号楼 302",area:"朝阳 · 双井",rent:6100,rooms:"一室一厅 · 62㎡",status:"可租",tags:["拎包入住"]},
 {id:"p6",name:"北苑家园 · 8号楼 201",area:"通州 · 北苑",rent:4500,rooms:"一室一厅 · 52㎡",status:"可租",tags:["预算友好"]}
 ],viewings:[
 {id:"v1",clientId:"c4",propertyId:"p3",property:"远洋新干线 · A座 1208",at:later(1),agent:"林晓",meeting:"楼下大堂",status:"待确认",createdAt:ago(24)},
 {id:"v2",clientId:"c5",propertyId:"p5",property:"双井新苑 · 3号楼 302",at:ago(5),agent:"王磊",meeting:"小区东门",status:"已完成",createdAt:ago(72),completedAt:ago(4),feedback:"采光有顾虑，需进一步回访"},
 {id:"v3",clientId:"c6",propertyId:"p6",property:"北苑家园 · 8号楼 201",at:ago(30),agent:"林晓",meeting:"楼下",status:"已完成",createdAt:ago(96),completedAt:ago(29),feedback:"通勤较远，希望二次推荐"},
 {id:"v4",clientId:"c7",propertyId:"p4",property:"国贸景苑 · 1号楼 508",at:ago(54),agent:"王磊",meeting:"楼下",status:"已完成",createdAt:ago(144),completedAt:ago(53),feedback:"满意并签约"}
 ],deals:[{id:"CJ-DEMO-001",clientId:"c7",propertyId:"p4",property:"国贸景苑 · 1号楼 508",rent:9800,commission:9800,received:0,at:ago(48),owner:"王磊",channel:"私域添加",note:"演示成交记录",createdAt:ago(48)}],tasks:[
 {id:"t1",clientId:"c1",kind:"first",title:"首次跟进",at:ago(2),createdAt:ago(26),status:"pending"},
 {id:"t2",clientId:"c2",kind:"followup",title:"确认需求后跟进",at:later(3),createdAt:ago(24),status:"pending"},
 {id:"t3",clientId:"c3",kind:"recommendation",title:"推荐后收集反馈",at:later(6),createdAt:ago(6),status:"pending"},
 {id:"t5",clientId:"c5",kind:"callback",title:"看房后回访",at:ago(2),createdAt:ago(4),status:"pending"},
 {id:"t6",clientId:"c6",kind:"followup",title:"二次推荐前沟通",at:later(24),createdAt:ago(29),status:"pending"}
 ],rules:{...defaultRules},entries:[]};
 for(const c of clients){s.entries.push({id:`create-${c.id}`,clientId:c.id,kind:"system",title:"建立客户档案",content:"客户已录入，等待首次沟通",owner:c.owner,at:c.createdAt});if(c.stage!=="待跟进")s.entries.push({id:`contact-${c.id}`,clientId:c.id,kind:"followup",title:"已确认需求，待推荐房源",content:`已确认意向区域 ${c.area}，预算 ${c.budget} 元/月`,owner:c.owner,at:new Date(Date.parse(c.createdAt!)+3600000).toISOString(),phase:"看房前",intent:c.intent,channel:"企微",result:"已确认需求，待推荐房源"});}
 for(const id of ["c3","c4","c5","c6","c7"]){const c=s.clients.find(c=>c.id===id)!;s.entries.push({id:`recommend-${id}`,clientId:id,kind:"recommendation",title:"推荐房源",content:"已根据预算与通勤要求发送房源信息",owner:c.owner,at:new Date(Date.parse(c.createdAt!)+7200000).toISOString(),propertyIds:[id==="c3"?"p2":id==="c4"?"p3":id==="c5"?"p5":id==="c6"?"p6":"p4"]});}
 for(const v of s.viewings){s.entries.push({id:`book-${v.id}`,clientId:v.clientId,kind:"viewing",title:"创建看房预约",content:v.property,owner:v.agent,at:v.createdAt});if(v.completedAt)s.entries.push({id:`finish-${v.id}`,clientId:v.clientId,kind:"viewing",title:"完成带看",content:v.feedback!,owner:v.agent,at:v.completedAt});}
 s.entries.push({id:"deal-demo",clientId:"c7",kind:"deal",title:"创建成交记录",content:"国贸景苑 · 1号楼 508；佣金待结算",owner:"王磊",at:ago(48)});
 return s;
}

export function dateRange(range:string,from:string,to:string,now=Date.now()):[number,number] {
 const today=localInput(now).slice(0,10),d=new Date(`${today}T00:00:00+08:00`),end=d.getTime()+86400000-1;const year=Number(today.slice(0,4)),month=Number(today.slice(5,7));
 if(range==="全部")return [-Infinity,Infinity];
 if(range==="自定义"){const start=Date.parse(`${from}T00:00:00+08:00`),finish=Date.parse(`${to}T23:59:59.999+08:00`);return [start,finish];}
 let start=new Date(`${year}-${String(month).padStart(2,"0")}-01T00:00:00+08:00`);
 if(range==="本周"){const weekday=new Date(`${today}T12:00:00Z`).getUTCDay();start=new Date(d.getTime()-((weekday+6)%7)*86400000);}
 if(range==="本季度")start=new Date(`${year}-${String(Math.floor((month-1)/3)*3+1).padStart(2,"0")}-01T00:00:00+08:00`);
 if(range==="本年")start=new Date(`${year}-01-01T00:00:00+08:00`);
 return [start.getTime(),end];
}
export const dateOnly=(v:Date|string|number=Date.now())=>localInput(v).slice(0,10);
