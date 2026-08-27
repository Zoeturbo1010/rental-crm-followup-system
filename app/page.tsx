"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: number; name: string; initials: string; phone: string; stage: string; area: string;
  budget: string; moveIn: string; next: string; nextAt?: string; owner: string; viewed: boolean; tags: string[]; last: string;
};
type FollowUp = { time: string; title: string; desc: string; result?: string; reason?: string };
type ReminderRules = { firstResponse: boolean; recommendation: boolean; viewingFollowup: boolean; viewingConfirmation: boolean };
type ViewingRecord = { id:number; clientId:number; time:string; property:string; agent:string; status:"待确认"|"已确认"|"已完成" };
type DealRecord = { id:string; clientId:number; clientName:string; property:string; rent:string; commission:string; status:string; owner:string; date:string };

const clients: Client[] = [
  { id: 1, name: "张雨晴", initials: "张", phone: "138****2681", stage: "待跟进", area: "朝阳 · 望京", budget: "¥5,000–6,000", moveIn: "8月初", next: "今天 16:30", owner: "林晓", viewed: false, tags: ["客户未回复", "首响超时", "高紧急", "平台内私信", "已加企微"], last: "平台进线后已加企微，尚未确认需求" },
  { id: 2, name: "陈浩然", initials: "陈", phone: "186****5708", stage: "待推荐", area: "海淀 · 中关村", budget: "¥6,000–7,500", moveIn: "8月中", next: "今天 17:00", owner: "林晓", viewed: false, tags: ["整租", "暂无需求", "高预算", "电话沟通", "已加企微"], last: "已确认整租一居需求，待推荐房源" },
  { id: 3, name: "李思琪", initials: "李", phone: "139****8372", stage: "待推荐", area: "朝阳 · 三里屯", budget: "¥7,000–9,000", moveIn: "半月后", next: "明天 10:00", owner: "王磊", viewed: false, tags: ["高意向", "半月后入住", "没有合适房源", "已收藏用户", "已加企微"], last: "已收藏 3 套，等待二次推荐" },
  { id: 4, name: "周先生", initials: "周", phone: "155****1209", stage: "待看房", area: "西城 · 金融街", budget: "¥8,000–10,000", moveIn: "8月1日", next: "今天 18:30", owner: "林晓", viewed: false, tags: ["今日看房", "已预约", "待预约", "金融街通勤", "已加企微"], last: "预约看房：远洋新干线 A-1208" },
  { id: 5, name: "赵小姐", initials: "赵", phone: "133****5162", stage: "待推荐", area: "朝阳 · 双井", budget: "¥5,500–6,500", moveIn: "8月初", next: "已超时 2小时", owner: "王磊", viewed: true, tags: ["看房后", "需回访", "待回访", "高紧急", "房子不合适", "已加企微"], last: "已看房未签约：房子不合适，需分析原因后再推荐" },
  { id: 6, name: "吴天宇", initials: "吴", phone: "187****3168", stage: "待推荐", area: "通州 · 北苑", budget: "¥4,000–5,000", moveIn: "8月中", next: "明天 14:00", owner: "林晓", viewed: true, tags: ["看房后", "预算不匹配", "二次推荐", "房子不合适", "已加企微"], last: "首套不满意：预算与通勤无法兼顾" },
  { id: 7, name: "刘嘉", initials: "刘", phone: "136****9428", stage: "已成交", area: "朝阳 · CBD", budget: "¥9,000–11,000", moveIn: "8月1日", next: "已完成", owner: "王磊", viewed: true, tags: ["已签约", "高意向", "平台内房源", "已加企微"], last: "已签约，待佣金结算" },
];

const columns = ["待跟进", "待推荐", "待看房", "已成交"];
const boardColumns = [
  { key: "unfollow", title: "未看房 · 待跟进", stage: "待跟进", viewed: false },
  { key: "unrecommend", title: "未看房 · 待推荐", stage: "待推荐", viewed: false },
  { key: "unviewing", title: "未看房 · 待看房", stage: "待看房", viewed: false },
  { key: "viewedrecommend", title: "已看房 · 待推荐", stage: "待推荐", viewed: true },
  { key: "vieweddeal", title: "已看房 · 已成交", stage: "已成交", viewed: true },
];
const tagFilters = ["全部标签", "未看房", "已看房", "待跟进", "待推荐", "待看房", "已成交", "高紧急", "高意向", "今日看房", "客户未回复", "暂无需求", "半月后入住", "没有合适房源", "预算不匹配", "已加企微", "仅浏览用户", "已收藏用户", "房子不合适", "二次推荐", "待回访", "待预约", "平台内私信", "电话沟通", "别处成交"];
const nav = [
  ["工作台", "◆"],
  ["客户管理", "♧"],
  ["跟进工作台", "◉"],
  ["看房管理", "⌚"],
  ["成交管理", "✦"],
  ["数据分析", "↗"],
];

const deals = [
  ["CJ20250730018", "刘嘉", "望京 SOHO · 2号楼 1608", "¥9,800/月", "¥9,800", "待结算", "王磊", "今天 11:20"],
  ["CJ20250729013", "孙宁", "远洋新干线 · A座 1208", "¥6,500/月", "¥6,500", "部分结算", "林晓", "昨天 17:46"],
  ["CJ20250728009", "马女士", "金茂府 · 3期 2单元", "¥12,000/月", "¥12,000", "已结算", "王磊", "7月28日"],
  ["CJ20250726025", "高哲", "望京西园 · 412", "¥5,800/月", "¥5,800", "已结算", "陈露", "7月26日"],
];
const initialViewings: ViewingRecord[] = [
  {id:1,clientId:4,time:"今天 18:30",property:"远洋新干线 A-1208",agent:"林晓",status:"已确认"},
  {id:2,clientId:3,time:"明天 10:00",property:"国贸景苑 1号楼",agent:"王磊",status:"待确认"},
];
const initialDealRecords: DealRecord[] = deals.map(item => ({id:item[0],clientId:item[1] === "刘嘉" ? 7 : 0,clientName:item[1],property:item[2],rent:item[3],commission:item[4],status:item[5],owner:item[6],date:item[7]}));

function Avatar({ value, large = false }: { value: string; large?: boolean }) { return <span className={`avatar ${large ? "large" : ""}`}>{value}</span>; }
function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
const displayDateTime = (value: string) => value.replace("T", " ");
const taskTimeLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return displayDateTime(value);
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((targetDay.getTime() - day.getTime()) / 86400000);
  const hm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  if (date.getTime() < now.getTime()) return "已超时";
  if (diff === 0) return `今天 ${hm}`;
  if (diff === 1) return `明天 ${hm}`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${hm}`;
};

export default function Home() {
  const [page, setPage] = useState("工作台");
  const [openTabs, setOpenTabs] = useState<string[]>(["工作台"]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [dealModal, setDealModal] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部标签");
  const [toast, setToast] = useState("");
  const [view, setView] = useState("看板");
  const [followUps, setFollowUps] = useState<Record<number, FollowUp[]>>({});
  const [appointmentClient, setAppointmentClient] = useState<Client | null>(null);
  const [clientRecords, setClientRecords] = useState<Client[]>(clients);
  const [clientModal, setClientModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [reminderRules, setReminderRules] = useState<ReminderRules>({ firstResponse: true, recommendation: true, viewingFollowup: true, viewingConfirmation: true });
  const [appointments, setAppointments] = useState<ViewingRecord[]>(initialViewings);
  const [dealRecords, setDealRecords] = useState<DealRecord[]>(initialDealRecords);
  const [dealClient, setDealClient] = useState<Client | null>(null);
  const [notifications, setNotifications] = useState<string[]>(["张雨晴：首响任务将于今天 16:30 到期"]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("rental-crm-demo-flow");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.clients)) setClientRecords(data.clients.map((client: Client) => ({
          ...client,
          tags: Array.from(new Set([...(client.tags ?? []), "已加企微"])),
          nextAt: client.nextAt ?? (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(client.next) ? client.next.replace(" ", "T") : undefined),
        })));
        if (Array.isArray(data.appointments)) setAppointments(data.appointments);
        if (Array.isArray(data.deals)) setDealRecords(data.deals);
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        if (data.followUps && typeof data.followUps === "object") setFollowUps(data.followUps);
      }
    } catch { /* 忽略损坏的本地演示缓存 */ }
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem("rental-crm-demo-flow", JSON.stringify({ clients: clientRecords, appointments, deals: dealRecords, notifications, followUps }));
  }, [appointments, clientRecords, dealRecords, followUps, notifications, storageReady]);
  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(value => value + 1), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    const overdue = clientRecords.filter(client => client.nextAt && client.stage !== "已成交" && new Date(client.nextAt).getTime() < Date.now() && !client.tags.includes("跟进超时"));
    if (!overdue.length) return;
    setClientRecords(current => current.map(client => overdue.some(item => item.id === client.id) ? { ...client, next: "已超时", tags: Array.from(new Set([...client.tags, "跟进超时", "高紧急"])) } : client));
    setNotifications(current => [...overdue.map(client => `${client.name}：下次跟进已超时，请立即处理`), ...current]);
  }, [clientRecords, clockTick, storageReady]);

  const visibleClients = useMemo(() => clientRecords.filter(c =>
    (filter === "全部标签" || (filter === "未看房" && !c.viewed) || (filter === "已看房" && c.viewed) || c.stage === filter || c.tags.includes(filter)) && `${c.name}${c.area}${c.phone}${c.tags.join("")}`.includes(query)
  ), [clientRecords, filter, query]);
  const searchText = query.trim();
  const searchClients = useMemo(() => searchText ? clientRecords.filter(client => `${client.name}${client.phone}${client.area}${client.tags.join("")}${client.owner}`.includes(searchText)).slice(0, 5) : [], [clientRecords, searchText]);
  const searchDeals = useMemo(() => searchText ? dealRecords.filter(deal => `${deal.id}${deal.clientName}${deal.property}${deal.owner}`.includes(searchText)).slice(0, 4) : [], [dealRecords, searchText]);
  const riskCount = clientRecords.filter(client => client.stage !== "已成交" && ((reminderRules.firstResponse && client.tags.includes("首响超时")) || (reminderRules.recommendation && client.stage === "待推荐") || (reminderRules.viewingFollowup && client.tags.includes("需回访")) || (reminderRules.viewingConfirmation && client.tags.includes("待预约")) || client.tags.includes("跟进超时"))).length;
  const alert = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const openPage = (target: string) => { setOpenTabs(current => current.includes(target) ? current : [...current, target]); setPage(target); };
  const closePage = (target: string) => { setOpenTabs(current => { const next = current.filter(item => item !== target); if (page === target) setPage(next[next.length - 1] ?? "工作台"); return next; }); };
  const startAppointment = (client: Client) => { setAppointmentClient(client); setSelected(null); openPage("预约看房"); };
  const updateClient = (nextClient:Client) => { setClientRecords(current => current.map(item => item.id === nextClient.id ? nextClient : item)); setSelected(current => current?.id === nextClient.id ? nextClient : current); };
  const syncFollowUp = (client:Client, desc:string, tags:string[], stage:string, nextAt:string, result:string, reason?:string) => {
    const extras = ["已加企微"];
    if (result.includes("待预约") || result.includes("安排带看")) extras.push("待预约");
    if (result.includes("仅浏览")) extras.push("仅浏览用户");
    if (result.includes("收藏")) extras.push("已收藏用户");
    if (result.includes("不合适")) extras.push("房子不合适", "二次推荐");
    if (result.includes("暂缓") || result.includes("暂无需求")) extras.push("暂无需求");
    if (result.includes("别处成交")) extras.push("别处成交");
    if (result.includes("回访")) extras.push("待回访", "需回访");
    const nextStage = result.includes("不合适") || result.includes("待推荐") ? "待推荐" : (result.includes("待预约") || result.includes("安排带看") ? "待看房" : result.includes("成交") ? "已成交" : stage);
    const finalDesc = reason ? `${desc}（原因：${reason}）` : desc;
    const updated = {...client, stage:nextStage, viewed: nextStage === "已成交" ? true : client.viewed, next:taskTimeLabel(nextAt), nextAt, last:finalDesc, tags:Array.from(new Set([...tags,...extras]))};
    updateClient(updated);
    setFollowUps(current => ({...current, [client.id]: [{time:"刚刚", title:"林晓 · 跟进记录", desc:finalDesc, result, reason}, ...(current[client.id] ?? [])]}));
    setNotifications(current => [`${client.name}：${result}，下次跟进 ${taskTimeLabel(nextAt)}`, ...current]);
    return updated;
  };
  const recommendClient = (client:Client) => { const nextAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0,16); syncFollowUp(client, "已发送匹配房源，等待客户反馈", Array.from(new Set([...client.tags,"已加企微"])), "待推荐", nextAt, "已推荐房源待反馈"); alert("推荐记录已同步，12 小时后将提醒跟进反馈"); };
  const createAppointment = (client:Client, property:string, time:string) => { const appointment={id:Date.now(),clientId:client.id,time:taskTimeLabel(time),property,agent:client.owner,status:"待确认" as const}; setAppointments(current=>[appointment,...current]); syncFollowUp(client, `已创建看房预约：${property}`, Array.from(new Set([...client.tags,"已预约","今日看房"])), "待看房", time, "客户有意向，待预约看房"); setNotifications(current=>[`${client.name}：已创建 ${taskTimeLabel(time)} 看房预约，待客户确认`,...current]); alert(`预约已创建：客户已进入看房管理，并生成提醒任务`); openPage("看房管理"); };
  const createDeal = (client:Client, property:string) => { const record:DealRecord={id:`CJ${Date.now().toString().slice(-8)}`,clientId:client.id,clientName:client.name,property,rent:"¥8,800/月",commission:"¥8,800",status:"待结算",owner:client.owner,date:"刚刚"}; setDealRecords(current=>[record,...current]); updateClient({...client,stage:"已成交",viewed:true,next:"已完成",last:`已成交：${property}`,tags:Array.from(new Set([...client.tags,"已签约"]))}); setNotifications(current=>[`${client.name}：成交记录已创建，待佣金结算`,...current]); alert("成交已同步至成交管理与客户时间线"); openPage("成交管理"); };

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">C</span><span>CRM 跟进系统</span></div>
      <div className="workspace"><span className="team-dot">K</span><div><b>北京租赁事业部</b><small>林晓 · 顾问</small></div><span>⌄</span></div>
      <nav>{nav.map(([label, icon]) => <button key={label} className={page === label || (label === "客户管理" && page === "客户详情") ? "active" : ""} onClick={() => openPage(label)}><i>{icon}</i>{label}{label === "工作台" && <em>8</em>}</button>)}</nav>
      <div className="sidebar-bottom"><button onClick={() => setNotificationOpen(true)}>♢ 通知中心 <em>{notifications.length}</em></button><button onClick={() => alert("系统设置已打开")}>⚙ 系统设置</button><div className="user-row"><Avatar value="林"/><div><b>林晓</b><small>租赁顾问</small></div><span>⋮</span></div></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="crumb">概览 <span>/</span> <b>{page}</b></div><div className="top-actions"><div className="global-search-wrap"><label className="global-search">⌕<input value={query} placeholder="搜索客户、手机号、成交单..." onFocus={() => setSearchOpen(true)} onChange={e => { setQuery(e.target.value); setSearchOpen(true); }} onKeyDown={e => { if(e.key === "Enter" && searchClients[0]) { setFilter("全部标签"); openPage("客户管理"); setSelected(searchClients[0]); setQuery(""); setSearchOpen(false); } if(e.key === "Escape") setSearchOpen(false); }} /></label>{searchOpen && searchText && <div className="search-popover">{searchClients.length + searchDeals.length ? <>{searchClients.length > 0 && <><span className="search-group">客户</span>{searchClients.map(client => <button key={client.id} onMouseDown={() => { setFilter("全部标签"); openPage("客户管理"); setSelected(client); setQuery(""); setSearchOpen(false); }}><Avatar value={client.initials}/><div><b>{client.name}</b><small>{client.phone}　·　{client.area}</small></div><em>{client.stage}</em></button>)}</>}{searchDeals.length > 0 && <><span className="search-group">成交记录</span>{searchDeals.map(deal => <button key={deal.id} onMouseDown={() => { openPage("成交管理"); setQuery(""); setSearchOpen(false); }}><span className="search-deal-icon">¥</span><div><b>{deal.id}</b><small>{deal.clientName}　·　{deal.property}</small></div><em>{deal.status}</em></button>)}</>}</> : <div className="search-empty">未找到相关客户或成交记录</div>}</div>}</div><button className="icon-btn" onClick={() => setNotificationOpen(true)} aria-label="打开提醒"><span>♧</span>{notifications.length > 0 && <i></i>}</button><button className="create" onClick={() => { setDealClient(clientRecords.find(client=>client.viewed) ?? clientRecords[0]); setDealModal(true); }}>＋ 新建成交</button></div></header>
      <div className="workspace-tabs"><button className="tab-nav" onClick={() => alert("已经是最左侧页面")}>‹</button>{openTabs.map(tab => <button key={tab} className={page === tab ? "open" : ""} onClick={()=>setPage(tab)}>{tab === "工作台" ? "▦" : tab === "跟进工作台" ? "◉" : tab === "看房管理" ? "⌚" : tab === "成交管理" ? "◈" : tab === "数据分析" ? "⌁" : tab === "超时任务" ? "!" : tab === "预约看房" ? "⌚" : "□"} {tab}<i onClick={(event)=>{event.stopPropagation();closePage(tab)}}>×</i></button>)}<span></span><button className="tab-nav" onClick={() => alert("没有更多已打开页面")}>›</button></div>
      <div className="content">{page === "工作台" && <Dashboard onPick={setSelected} onNavigate={openPage} alert={alert} riskCount={riskCount} clients={clientRecords} appointments={appointments} deals={dealRecords} />}
        {page === "客户管理" && <Pipeline page={page} clients={visibleClients} filter={filter} setFilter={setFilter} setSelected={setSelected} view={view} setView={setView} onCreate={() => setClientModal(true)} query={query} setQuery={setQuery} alert={alert} />}
        {page === "跟进工作台" && <FollowUpWorkspaceV2 clients={clientRecords} onPick={setSelected} onSave={(client,desc,nextAt,result)=>syncFollowUp(client,desc,client.tags,client.stage,nextAt,result)} />}
        {page === "看房管理" && <ViewingV2 records={appointments} clients={clientRecords} onPick={setSelected} onCreate={() => startAppointment(clientRecords.find(client=>client.stage !== "已成交") ?? clientRecords[0])} onComplete={(record) => { const client=clientRecords.find(item=>item.id===record.clientId); if(client) { const followupAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0,16); syncFollowUp(client, `已完成看房：${record.property}，待回访`, Array.from(new Set([...client.tags,"看房后"])), "待推荐", followupAt, "看房完成待回访"); setAppointments(current=>current.map(item=>item.id===record.id?{...item,status:"已完成"}:item)); setNotifications(current=>[`${client.name}：看房已完成，请在 2 小时内回访`,...current]); alert("看房结果已同步到客户跟进，并创建回访提醒"); } }} />}
        {page === "预约看房" && appointmentClient && <AppointmentFormV2 client={appointmentClient} clients={clientRecords.filter(client => client.stage !== "已成交")} onClientChange={setAppointmentClient} onBack={() => setPage("客户管理")} onDone={createAppointment} />}
        {page === "成交管理" && <DealsV2 records={dealRecords} onEdit={(record) => { const client=clientRecords.find(item=>item.id===record.clientId); setDealClient(client ?? null); setDealModal(true); }} />}
        {page === "数据分析" && <Analytics clients={clientRecords} deals={dealRecords} />}
        {page === "超时任务" && <OverdueTasks onPick={setSelected} onBack={() => setPage("工作台")} alert={alert} riskCount={riskCount} onSettings={() => setReminderSettingsOpen(true)} />}
      </div>
    </section>
    {selected && <ClientDrawerV2 client={selected} followUps={followUps[selected.id] ?? []} appointments={appointments} onAddFollowUp={(entry) => setFollowUps(current => ({ ...current, [selected.id]: [entry, ...(current[selected.id] ?? [])] }))} onUpdateClient={updateClient} onRecommend={() => recommendClient(selected)} onClose={() => setSelected(null)} onDeal={() => { setDealClient(selected); setSelected(null); setDealModal(true); }} onAppointment={() => startAppointment(selected)} alert={alert} />}
    {dealModal && <DealModalV2 client={dealClient ?? clientRecords[0]} appointments={appointments.filter(item=>item.clientId === (dealClient?.id ?? clientRecords[0].id))} onClose={() => setDealModal(false)} onSave={createDeal} />}
    {clientModal && <NewClientModalV2 onClose={() => setClientModal(false)} onSave={(client) => { const enriched = {...client, tags:Array.from(new Set([...client.tags,"已加企微"]))}; setClientRecords(current => [enriched, ...current]); setFollowUps(current => ({...current, [enriched.id]: [{time:"刚刚",title:"林晓 · 建立客户档案",desc:enriched.last,result:"已加企微，待首次跟进"}]})); setNotifications(current => [`${enriched.name}：已创建下次跟进任务（${enriched.next}）`, ...current]); setClientModal(false); openPage("跟进工作台"); alert("客户已加入跟进工作台，并创建应用内提醒"); }} />}
    {notificationOpen && <NotificationCenter notifications={notifications} onClose={() => setNotificationOpen(false)} onProcess={() => { setNotificationOpen(false); openPage("跟进工作台"); }} />}
    {reminderSettingsOpen && <ReminderSettingsModal rules={reminderRules} onChange={setReminderRules} onClose={() => { setReminderSettingsOpen(false); alert("提醒规则已更新，风险队列已同步刷新"); }} />}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}

function NotificationCenter({ notifications, onClose, onProcess }: { notifications: string[]; onClose: () => void; onProcess: () => void }) {
  return <div className="notification-backdrop" onMouseDown={onClose}>
    <section className="notification-center" onMouseDown={event => event.stopPropagation()}>
      <header><div><span>REMINDERS</span><h2>待办提醒</h2><p>提醒由新增客户、下次跟进与看房流转自动生成。</p></div><button className="close" onClick={onClose}>×</button></header>
      <div className="notification-list">{notifications.length ? notifications.map((item, index) => <button key={`${item}-${index}`} onClick={onProcess}><i>{index === 0 ? "!" : "◷"}</i><div><b>{item}</b><small>{index === 0 ? "刚刚更新 · 待处理" : "业务流程提醒"}</small></div><span>去处理 ›</span></button>) : <div className="notification-empty">当前没有新的待办提醒</div>}</div>
      <footer><button onClick={onClose}>稍后处理</button><button className="primary" onClick={onProcess}>进入跟进工作台</button></footer>
    </section>
  </div>;
}

function Dashboard({ onPick, onNavigate, alert, riskCount, clients, appointments, deals }: { onPick: (c: Client) => void; onNavigate: (p:string) => void; alert:(message:string)=>void; riskCount:number; clients:Client[]; appointments:ViewingRecord[]; deals:DealRecord[] }) {
  const [priorityFilter, setPriorityFilter] = useState<"紧急"|"今天待办"|"明日跟进">("紧急");
  const activeClients = clients.filter(client => client.stage !== "已成交");
  const urgentClients = activeClients.filter(client => client.next.includes("超时") || client.tags.includes("高紧急") || client.tags.includes("需回访"));
  const todayClients = activeClients.filter(client => client.next.includes("今天"));
  const tomorrowClients = activeClients.filter(client => client.next.includes("明天") || client.next.includes("2026-08-27"));
  const focus = (priorityFilter === "紧急" ? urgentClients : priorityFilter === "今天待办" ? todayClients : tomorrowClients).slice(0,4);
  const pendingViewings = appointments.filter(item => item.status !== "已完成");
  const completedViewings = appointments.filter(item => item.status === "已完成");
  const totalLeads = Math.max(clients.length, 1);
  const confirmedDemand = clients.filter(client => client.stage !== "待跟进").length;
  const recommended = clients.filter(client => ["待推荐", "待看房", "已成交"].includes(client.stage)).length;
  const funnelRows = [["IM 进线",clients.length,100,"#4a86ef"],["需求确认",confirmedDemand,Math.round(confirmedDemand / totalLeads * 100),"#6b9bf2"],["房源推荐",recommended,Math.round(recommended / totalLeads * 100),"#8eb4f8"],["实际看房",clients.filter(client=>client.viewed).length,Math.round(clients.filter(client=>client.viewed).length / totalLeads * 100),"#b3cef9"],["完成成交",deals.length,Math.round(deals.length / totalLeads * 100),"#d6e5ff"]] as const;
  const todaySchedule = appointments.slice(0, 3).map(item => ({ ...item, client: clients.find(client => client.id === item.clientId) })).filter((item): item is ViewingRecord & { client: Client } => Boolean(item.client));
  const [guideOpen, setGuideOpen] = useState(false);
  return <div className="premium-dashboard"><section className="command-hero"><div className="hero-copy"><div className="eyebrow"><i></i> 运营指挥中心 <span>实时</span></div><h1>今天，把 <b>{urgentClients.length} 位高风险客户</b> 推进到下一步</h1><p>当前共有 {activeClients.length} 条活跃线索，其中 {urgentClients.length} 条需要优先处理。</p><div className="hero-actions"><button className="hero-primary" onClick={()=>onNavigate("跟进工作台")}>处理今日待办 <b>{todayClients.length}</b> →</button><button onClick={()=>onNavigate("数据分析")}>查看业务健康度</button><button className="portfolio-guide-trigger" onClick={()=>setGuideOpen(true)}>作品体验导览</button></div></div><div className="hero-progress"><div><span>本月成交目标</span><b>{deals.length} <small>/ 60 单</small></b></div><div className="progress-track"><i style={{width:`${Math.min(deals.length / 60 * 100, 100)}%`}}></i></div><div className="progress-meta"><span>完成 {Math.round(deals.length / 60 * 100)}%</span><span>还差 {Math.max(60 - deals.length, 0)} 单</span></div><div className="mini-spark">{[28,46,34,56,44,70,60,78,69,90,82,102].map((x,i)=><i key={i} style={{height:x}}></i>)}</div></div></section>
  <section className="premium-kpis"><div><span className="kpi-glyph blue">⌁</span><p>活跃线索</p><b>{activeClients.length}</b><small className="up">客户管理实时同步</small></div><button className="risk-kpi" onClick={()=>onNavigate("超时任务")}><span className="kpi-glyph orange">!</span><p>待处理风险 <i>查看明细 →</i></p><b>{riskCount}</b><small className={riskCount ? "down" : "up"}>{riskCount ? `${riskCount} 条由提醒规则识别` : "当前暂无触发的风险"}<em>{riskCount ? "需立即处理" : ""}</em></small></button><div><span className="kpi-glyph purple">⌂</span><p>待看房预约</p><b>{pendingViewings.length}</b><small className="up">已与看房管理同步</small></div><div><span className="kpi-glyph green">¥</span><p>本月成交</p><b>{deals.length}</b><small className="up">{deals.filter(item=>item.status === "已结算").length} 笔已结算</small></div></section>
  <div className="command-grid"><section className="priority-panel"><div className="premium-title"><div><span>PRIORITY QUEUE</span><h2>优先处理队列</h2></div><button onClick={()=>onNavigate("跟进工作台")}>全部待办 →</button></div><div className="priority-tabs"><button className={priorityFilter === "紧急" ? "active" : ""} onClick={()=>setPriorityFilter("紧急")}>紧急 <i>{urgentClients.length}</i></button><button className={priorityFilter === "今天待办" ? "active" : ""} onClick={()=>setPriorityFilter("今天待办")}>今天待办 <i>{todayClients.length}</i></button><button className={priorityFilter === "明日跟进" ? "active" : ""} onClick={()=>setPriorityFilter("明日跟进")}>明日跟进 <i>{tomorrowClients.length}</i></button></div>{focus.length ? focus.map((c,index)=><button key={c.id} className="priority-row" onClick={()=>onPick(c)}><div className={`urgency u${index+1}`}>{c.next.includes("超时")?"已超时":c.viewed?"看房后":"待跟进"}</div><Avatar value={c.initials}/><div className="priority-person"><b>{c.name}<small>{c.viewed?"已看房":"未看房"} · {c.stage}</small></b><p>{c.last}</p><div>{c.tags.slice(0,2).map(t=><span key={t}>#{t}</span>)}</div></div><div className="priority-action"><small>{c.next}</small><span>→</span></div></button>) : <div className="priority-empty">当前筛选条件下暂无待办</div>}</section>
  <section className="pipeline-panel"><div className="premium-title"><div><span>FUNNEL PULSE</span><h2>转化脉搏</h2></div><button onClick={()=>onNavigate("数据分析")}>分析详情 →</button></div><div className="pipeline-summary"><div><b>{Math.round(deals.length / totalLeads * 100)}%</b><span>整体成交率</span></div><p>随业务操作实时更新<br/><small>客户、看房与成交使用同一份数据</small></p></div><div className="funnel-lanes">{funnelRows.map(([n,v,w,color])=><div key={n}><span>{n}</span><b>{v}</b><i><em style={{width:`${w}%`,background:color}}></em></i></div>)}</div><div className="insight"><span>✦</span><p><b>关键发现：</b> 完成看房后仍未成交的客户，需要进入二次推荐和回访队列。</p><button onClick={()=>onNavigate("跟进工作台")}>去处理</button></div></section></div>
  <div className="bottom-command-grid"><section className="calendar-panel"><div className="premium-title"><div><span>FIELD SCHEDULE</span><h2>今日带看排程</h2></div><button onClick={()=>onNavigate("看房管理")}>日历视图 →</button></div><div className="schedule-scale"><b>14:00</b><b>16:00</b><b>18:00</b><b>20:00</b></div><div className="schedule-blocks">{todaySchedule.length ? todaySchedule.map((item,index)=><button className={`booking b${index+1}`} onClick={()=>onPick(item.client)} key={item.id}><b>{item.time.replace("今天 ", "")}</b><span>{item.client.name} · {item.property}</span><small>{item.agent} · {item.status}</small></button>) : <div className="priority-empty">暂无待看房预约</div>}</div><div className="calendar-legend"><span><i></i> 已确认</span><span><i></i> 待确认</span><span><i></i> 需提醒</span></div></section><section className="team-panel"><div className="premium-title"><div><span>TEAM FOCUS</span><h2>团队动态与排行</h2></div><button onClick={()=>alert("已切换为本周团队排行")}>本周 ▾</button></div><div className="rank-row"><span>01</span><Avatar value="王"/><div><b>王磊</b><small>成交 12 单 · 转化率 24.5%</small></div><strong>¥98,600</strong></div><div className="rank-row"><span>02</span><Avatar value="林"/><div><b>林晓</b><small>成交 10 单 · 转化率 22.9%</small></div><strong>¥76,800</strong></div><div className="rank-row"><span>03</span><Avatar value="陈"/><div><b>陈露</b><small>成交 8 单 · 转化率 21.2%</small></div><strong>¥63,500</strong></div></section></div>{guideOpen && <div className="portfolio-guide-backdrop" onMouseDown={()=>setGuideOpen(false)}><section className="portfolio-guide" onMouseDown={event=>event.stopPropagation()}><header><div><span>INTERVIEWER WALKTHROUGH</span><h2>租房客户转化流程</h2><p>用 3 分钟体验从线索到成交的关键业务闭环。</p></div><button className="close" onClick={()=>setGuideOpen(false)}>×</button></header><div className="guide-flow"><button onClick={()=>{setGuideOpen(false);onNavigate("客户管理")}}><i>01</i><div><b>新增客户</b><p>录入私域或平台线索，完善区域、预算和入住时间。</p></div><span>→</span></button><button onClick={()=>{setGuideOpen(false);onPick(clients[0])}}><i>02</i><div><b>记录跟进</b><p>在客户详情填写沟通结果、标签与下一步待办。</p></div><span>→</span></button><button onClick={()=>{setGuideOpen(false);onPick(clients.find(client=>client.stage === "待看房") ?? clients[0])}}><i>03</i><div><b>预约看房</b><p>承接跟进内容，自动带入客户需求与负责人。</p></div><span>→</span></button><button onClick={()=>{setGuideOpen(false);onNavigate("成交管理")}}><i>04</i><div><b>成交结算</b><p>关联看房记录，记录租赁、佣金及结算进度。</p></div><span>→</span></button><button onClick={()=>{setGuideOpen(false);onNavigate("数据分析")}}><i>05</i><div><b>经营分析</b><p>查看漏斗、效率与流失原因，定位转化问题。</p></div></button></div><footer><b>作品说明</b><span>聚焦租房顾问的客户转化流程与可追溯运营数据。</span><button className="primary" onClick={()=>{setGuideOpen(false);onNavigate("客户管理")}}>开始体验 →</button></footer></section></div>}</div>;
}

function OverdueTasks({onPick,onBack,alert,riskCount,onSettings}:{onPick:(c:Client)=>void;onBack:()=>void;alert:(message:string)=>void;riskCount:number;onSettings:()=>void}) {
  const rows = [
    [clients[4],"2小时18分","看房后未回访","客户反馈尚未记录，系统连续提醒 2 次"],
    [clients[0],"1小时42分","首响超时","IM 进线后尚未完成需求确认"],
    [clients[2],"48分钟","推荐超时","客户提出新条件，尚未补充推荐方案"],
    [clients[3],"35分钟","看房确认","今日 18:30 看房，尚未完成二次确认"],
  ];
  return <><div className="page-heading overdue-heading"><div><button className="back-link" onClick={onBack}>← 返回工作台</button><h1>超时任务</h1><p>由已启用的待办提醒规则自动识别，需要立即推进的客户任务</p></div><button className="create" onClick={()=>alert("已向 " + riskCount + " 位风险客户发送提醒")}>批量提醒客户</button></div>
    <div className="overdue-summary"><div><span>当前超时任务</span><b>{riskCount}</b><small>随提醒规则实时刷新</small></div><div><span>高紧急任务</span><b className="red-text">{Math.min(3,riskCount)}</b><small>已超过 SLA 2 小时</small></div><div><span>平均超时时长</span><b>1.4 <i>小时</i></b><small>目标不超过 30 分钟</small></div><div><span>今日已处理</span><b className="green-text">12</b><small>处理完成率 66.7%</small></div></div>
    <section className="overdue-rules"><div><b>当前预警规则</b><span>新进线 5 分钟未首响</span><span>推荐后 12 小时未跟进</span><span>看房完成 2 小时未回访</span><button onClick={onSettings}>规则设置</button></div></section>
    <section className="panel overdue-table"><div className="table-toolbar"><label>⌕<input placeholder="搜索客户、负责人或任务" /></label><select><option>全部超时等级</option><option>高紧急</option><option>一般</option></select><select><option>全部任务类型</option><option>首响超时</option><option>看房后未回访</option></select><button onClick={()=>alert("已按当前条件筛选超时任务")}>筛选</button></div><table><thead><tr><th>超时等级</th><th>客户</th><th>当前阶段</th><th>超时任务</th><th>超时时长</th><th>风险说明</th><th>负责人</th><th>操作</th></tr></thead><tbody>{rows.map(([client,duration,type,note],index)=>{const c=client as Client;return <tr key={c.id}><td><Badge tone={index<2?"orange":"blue"}>{index<2?"高紧急":"一般"}</Badge></td><td><button className="person-link" onClick={()=>onPick(c)}><Avatar value={c.initials}/>{c.name}</button></td><td><Badge tone={c.viewed?"purple":"blue"}>{c.viewed?"已看房":"未看房"} · {c.stage}</Badge></td><td><b>{type as string}</b></td><td className={index<2?"red-text":""}>{duration as string}</td><td>{note as string}</td><td>{c.owner}</td><td><button className="link-btn" onClick={()=>onPick(c)}>立即处理 →</button></td></tr>})}</tbody></table><footer className="table-footer">当前展示 {Math.min(rows.length,riskCount)} 条任务 <span>‹ 1 ›</span></footer></section></>;
}

function Metric({label,value,detail,tone,icon}:{label:string;value:string;detail:string;tone:string;icon:string}) { return <section className="metric"><span className={`metric-icon ${tone}`}>{icon}</span><p>{label}</p><h2>{value}</h2><small className={tone === "green" || tone === "blue" ? "positive" : ""}>{detail}</small></section>; }
function PanelTitle({title, action, onAction}:{title:string;action:string;onAction?:()=>void}) { return <div className="panel-title"><h2>{title}</h2>{action && (onAction ? <button onClick={onAction}>{action} ›</button> : <span className="panel-passive-action">{action} ›</span>)}</div>; }

function Pipeline({page,clients,filter,setFilter,setSelected,view,setView,onCreate,query,setQuery,alert}:{page:string;clients:Client[];filter:string;setFilter:(x:string)=>void;setSelected:(c:Client)=>void;view:string;setView:(x:string)=>void;onCreate:()=>void;query:string;setQuery:(value:string)=>void;alert:(message:string)=>void}) { return <><div className="page-heading"><div><h1>{page === "客户管理" ? "客户管理" : "客户跟进看板"}</h1><p>用阶段标签组织客户，快速识别下一步该做什么</p></div><div className="page-actions"><button className="create" onClick={onCreate}>＋ 新增客户</button><div className="view-switch"><button className={view === "看板" ? "selected" : ""} onClick={() => setView("看板")}>▦ 看板</button><button className={view === "列表" ? "selected" : ""} onClick={() => setView("列表")}>☷ 列表</button></div></div></div>
  <section className="tag-filter-panel"><div className="tag-filter-title"><b>客户阶段</b><span>先按是否看房区分，再按当前待办筛选</span></div><div className="stage-filter-row"><button className={filter === "全部标签" ? "picked" : ""} onClick={()=>setFilter("全部标签")}>全部 <em>{clients.length}</em></button><button className={filter === "未看房" ? "picked blue" : "blue"} onClick={()=>setFilter("未看房")}>未看房 <em>{clients.filter(c=>!c.viewed).length}</em></button><button className={filter === "已看房" ? "picked purple" : "purple"} onClick={()=>setFilter("已看房")}>已看房 <em>{clients.filter(c=>c.viewed).length}</em></button><i></i>{["待跟进","待推荐","待看房","已成交"].map(x=><button key={x} className={filter === x ? "picked" : ""} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="tag-filter-title secondary"><b>业务标签</b><span>支持按风险、需求、来源等标签定位客户</span></div><div className="tag-chip-row">{tagFilters.slice(7).map(x=><button className={filter === x ? "selected-tag" : ""} onClick={()=>setFilter(x)} key={x}>#{x}</button>)}</div></section>
  <div className="filterbar"><label>⌕<input value={query} placeholder="搜索客户姓名、手机号" onChange={e => setQuery(e.target.value)} /></label><select value={filter} onChange={e => setFilter(e.target.value)}>{tagFilters.map(x => <option key={x}>{x}</option>)}</select><select onChange={e=>alert(`已选择负责人：${e.target.value}`)}><option>全部负责人</option><option>林晓</option><option>王磊</option></select><select onChange={e=>alert(`已选择区域：${e.target.value}`)}><option>全部区域</option><option>朝阳区</option><option>海淀区</option></select><button className="filter-more" onClick={()=>alert("更多筛选项已应用到当前客户列表")}>☷ 更多筛选</button><button className="reset" onClick={() => {setFilter("全部标签");setQuery("")}}>重置</button></div>
  {view === "看板" ? <div className="board">{boardColumns.map(col => { const inCol = clients.filter(c => c.stage === col.stage && c.viewed === col.viewed); return <section className="board-column" key={col.key}><header><span className={`stage-dot ${col.stage}`}></span><div><small>{col.viewed ? "已看房" : "未看房"}</small><b>{col.stage}</b></div><em>{inCol.length}</em><button onClick={onCreate}>＋</button></header><div>{inCol.map(c => <button className="client-card" key={c.id} onClick={() => setSelected(c)}><div><Avatar value={c.initials}/><span><b>{c.name}</b><small>{c.phone}</small></span><i>⋮</i></div><p>{c.area}</p><strong>{c.budget}</strong><div className="card-tags">{c.tags.slice(0,3).map(tag=><span key={tag} className={tag === "高紧急" || tag === "首响超时" ? "risk" : tag === "高意向" || tag === "已签约" ? "success" : ""}>#{tag}</span>)}</div><div className="card-foot"><span>◷ {c.next}</span><Avatar value={c.owner.slice(0,1)}/></div></button>)}{inCol.length === 0 && <div className="empty-col">暂无客户</div>}</div></section>})}</div> : <section className="panel client-table"><table><thead><tr><th>客户</th><th>阶段标签</th><th>业务标签</th><th>意向区域</th><th>预算</th><th>下次跟进</th><th>负责人</th><th></th></tr></thead><tbody>{clients.map(c => <tr key={c.id} onClick={() => setSelected(c)}><td><Avatar value={c.initials}/><b>{c.name}</b><small>{c.phone}</small></td><td><Badge tone={c.viewed ? "purple" : "blue"}>{c.viewed ? "已看房" : "未看房"} · {c.stage}</Badge></td><td><div className="table-tags">{c.tags.slice(0,2).map(tag=><span key={tag}>#{tag}</span>)}</div></td><td>{c.area}</td><td>{c.budget}</td><td className={c.next.includes("超时") ? "red-text" : ""}>{c.next}</td><td>{c.owner}</td><td>›</td></tr>)}</tbody></table></section>}</> }

function Analytics({clients,deals}:{clients:Client[];deals:DealRecord[]}) { const imCount=clients.length; const validCount=clients.filter(c=>c.stage!=="待跟进").length; const recommendedCount=clients.filter(c=>["待推荐","待看房","已成交"].includes(c.stage)).length; const viewedCount=clients.filter(c=>c.viewed).length; const dealCount=deals.length; const pct=(n:number)=>imCount?Math.round(n/imCount*100):0; const days = [38,55,44,72,66,91,78,104,86,118,94,136]; const [range,setRange] = useState("本月"); const [open,setOpen] = useState(false); const [from,setFrom] = useState("2025-07-01"); const [to,setTo] = useState("2025-07-30"); const [activeTab,setActiveTab] = useState("转化漏斗"); const periods:Record<string,string> = {"本周":"2025.07.27 – 2025.08.02","本月":"2025.07.01 – 2025.07.30","本季度":"2025.07.01 – 2025.09.30","本年":"2025.01.01 – 2025.12.31"}; const rangeLabel = range === "自定义时段" ? `${from.replaceAll("-",".")} – ${to.replaceAll("-",".")}` : periods[range]; const applyCustom=()=>{setRange("自定义时段");setOpen(false)}; return <><div className="page-heading"><div><h1>数据分析</h1><p>追踪获客质量与全链路转化效率</p></div><div className="date-filter"><button className="date-pick" onClick={()=>setOpen(value=>!value)}>⌚ {rangeLabel} <b>▾</b></button>{open && <div className="date-menu"><p>快捷时段</p>{["本周","本月","本季度","本年"].map(item=><button key={item} className={range===item?"active":""} onClick={()=>{setRange(item);setOpen(false)}}>{item}<span>{periods[item]}</span></button>)}<div className="custom-range"><p>自定义时段</p><label>开始日期<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>结束日期<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><button className="primary" onClick={applyCustom}>应用筛选</button></div></div>}</div></div><div className="analysis-tabs">{["转化漏斗","过程效率","客户与渠道","流失分析"].map(tab=><button className={activeTab===tab?"active":""} onClick={()=>setActiveTab(tab)} key={tab}>{tab}</button>)}</div><div className="analysis-caption">当前统计时段：{rangeLabel}　·　分析维度：{activeTab}</div><div className="metric-grid analysis-metrics"><Metric label="IM 进线客户" value={String(imCount)} detail="来自客户管理实时数据" tone="blue" icon="♙"/><Metric label="实际看房客户" value={String(viewedCount)} detail={"实看率 "+pct(viewedCount)+"%"} tone="purple" icon="⌂"/><Metric label="已成交客户" value={String(dealCount)} detail={"整体成交率 "+pct(dealCount)+"%"} tone="green" icon="✓"/><Metric label="平均成交周期" value="8.6 天" detail="较上月缩短 1.2 天" tone="orange" icon="◷"/></div><div className="analytics-grid"><section className="panel funnel-wide"><PanelTitle title="客户转化漏斗" action=""/><div className="funnel-visual">{[["IM 进线",imCount,"100%","100%"],["有效客户",validCount,pct(validCount)+"%",pct(validCount)+"%"],["已推荐",recommendedCount,validCount?Math.round(recommendedCount/Math.max(validCount,1)*100)+"%":"0%",pct(recommendedCount)+"%"],["实际看房",viewedCount,recommendedCount?Math.round(viewedCount/Math.max(recommendedCount,1)*100)+"%":"0%",pct(viewedCount)+"%"],["已成交",dealCount,viewedCount?Math.round(dealCount/Math.max(viewedCount,1)*100)+"%":"0%",pct(dealCount)+"%"]].map(([x,n,step,total],i)=><div className="funnel-step" key={x as string}><span>{x}</span><div style={{width:`${100-i*13}%`}}><b>{n}</b><small>{step} 环节转化</small></div><em>{total}<small>整体</small></em></div>)}</div></section><section className="panel conversion"><PanelTitle title="各环节转化率" action=""/><div className="donut"><span><b>{pct(dealCount)}%</b><small>整体成交率</small></span></div><ul><li><i className="dot b"></i>推荐 → 预约 <b>{recommendedCount?Math.round(clients.filter(c=>["待看房","已成交"].includes(c.stage)).length/Math.max(recommendedCount,1)*100):0}%</b></li><li><i className="dot p"></i>预约 → 实看 <b>{viewedCount?Math.round(viewedCount/Math.max(clients.filter(c=>["待看房","已成交"].includes(c.stage)).length,1)*100):0}%</b></li><li><i className="dot g"></i>实看 → 成交 <b>{viewedCount?Math.round(dealCount/Math.max(viewedCount,1)*100):0}%</b></li></ul></section></div><div className="analytics-grid lower"><section className="panel line-chart"><PanelTitle title="进线与成交趋势" action="按天"/><div className="chart-y">140<br/>105<br/>70<br/>35<br/>0</div><div className="bars">{days.map((h,i)=><div key={i}><i style={{height:`${h}px`}}></i>{i%2===0&&<small>{i+1}日</small>}</div>)}</div><div className="legend"><span>■ IM进线</span><span className="legend-line">━ 成交数</span></div></section><section className="panel loss"><PanelTitle title="未成交主要原因" action="查看详情"/><div className="loss-list">{[["预算不匹配",36,42],["暂无合适房源",28,33],["通过其他渠道成交",19,23],["联系不上",14,16],["不接受佣金",9,10]].map(([x,n,w])=><div key={x as string}><span>{x}</span><b>{n}</b><i><em style={{width:`${w}%`}}></em></i></div>)}</div></section></div></> }

function FormSection({title,children}:{title:string;children:React.ReactNode}) { return <section className="form-section"><h3>{title}</h3><div className="form-grid">{children}</div></section>; }
function Field({label,value,suffix,select}:{label:string;value:string;suffix?:string;select?:boolean}) { return <label className="field"><span>{label} <i>*</i></span><div><input defaultValue={value}/>{select&&<b>⌄</b>}{suffix&&<em>{suffix}</em>}</div></label>; }

function FollowUpWorkspaceV2({clients,onPick,onSave}:{clients:Client[];onPick:(client:Client)=>void;onSave:(client:Client,desc:string,nextAt:string,result:string)=>void}) {
  const tasks = clients.filter(client=>client.stage !== "已成交").sort((a,b)=>a.next.includes("已超时") ? -1 : b.next.includes("已超时") ? 1 : 0);
  const [activeId,setActiveId]=useState(tasks[0]?.id ?? clients[0]?.id ?? 0);
  const [draft,setDraft]=useState("");
  const [result,setResult]=useState("已联系等待反馈");
  const [nextTime,setNextTime]=useState("2026-08-27T16:00");
  const active=clients.find(c=>c.id===activeId) ?? tasks[0] ?? clients[0];
  return <><div className="page-heading"><div><h1>跟进工作台</h1><p>所有新增客户、下次跟进时间与看房后的回访任务都会自动汇总到这里。</p></div><button className="create" onClick={()=>tasks[0] && onPick(tasks[0])}>处理下一条待办</button></div>
    <div className="workflow-context flow-strip"><span>客户流转</span><b>平台进线</b><i>→</i><b>询问需求</b><i>→</i><b className="current">加企微</b><i>→</i><b>推荐房源</b><i>→</i><b>预约看房</b><i>→</i><b>成交</b></div>
    <div className="followup-metrics"><div><span>待跟进客户</span><b>{tasks.filter(client=>client.stage==="待跟进").length}</b><small>来自客户管理的新建线索</small></div><div><span>待推荐客户</span><b>{tasks.filter(client=>client.stage==="待推荐").length}</b><small>含看房后待二次推荐</small></div><div><span>待看房客户</span><b>{tasks.filter(client=>client.stage==="待看房").length}</b><small>已进入看房管理</small></div><div><span>需回访</span><b className="green-text">{tasks.filter(client=>client.tags.includes("需回访")).length}</b><small>看房完成后自动生成</small></div></div>
    <section className="followup-layout"><aside className="followup-queue"><header><div><span>FOLLOW-UP QUEUE</span><h2>统一待办队列</h2></div><button>按下次时间</button></header><div className="queue-tabs"><b>全部 <i>{tasks.length}</i></b><span>今天 <i>{tasks.filter(client=>client.next.includes("今天")).length}</i></span></div>{tasks.map((client,index)=><button className={activeId===client.id?"queue-item selected":"queue-item"} onClick={()=>setActiveId(client.id)} key={client.id}><div className={index===0?"queue-time q0":"queue-time"}>{client.next.includes("已超时")?"超时":client.next.replace("今天 ","")}</div><Avatar value={client.initials}/><div><b>{client.name}<small>{client.viewed?"已看房":"未看房"} · {client.stage}</small></b><p>{client.last}</p></div><span>›</span></button>)}</aside><section className="followup-editor"><header><div className="editor-client"><Avatar value={active.initials} large/><div><h2>{active.name} <Badge tone={active.viewed?"purple":"blue"}>{active.viewed?"已看房":"未看房"} · {active.stage}</Badge></h2><p>{active.phone}　·　{active.area}　·　{active.budget}</p></div></div><button onClick={()=>onPick(active)}>详情 →</button></header><div className="editor-body"><div className="editor-context"><span>当前任务</span><b>{active.last}</b><div>{active.tags.map(tag=><i key={tag}>#{tag}</i>)}</div></div><div className="record-form"><h3>填写本次跟进</h3><div className="result-row"><label>跟进结果<select value={result} onChange={e=>setResult(e.target.value)}><option>已联系等待反馈</option><option>已确认需求待推荐</option><option>客户有意向待预约看房</option><option>仅浏览用户安排带看</option><option>已收藏用户安排带看</option><option>房子不合适，二次推荐</option><option>客户暂缓</option><option>无法联系</option></select></label><label>下次跟进时间<input type="datetime-local" value={nextTime} onChange={e=>setNextTime(e.target.value)} /></label></div><label className="record-note">跟进内容<textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="记录客户的最新反馈、需求变化、房源偏好或下一步计划..." /></label><div className="form-save"><span>保存后将同步客户状态、标签与提醒</span><button className="create" onClick={()=>{if(draft.trim()){onSave(active,draft.trim(),nextTime,result);setDraft("");}}}>保存并同步</button></div></div><div className="recent-records"><h3>最近跟进记录</h3><div><i></i><p>{draft.trim()||"尚未填写本次跟进内容"}</p><small>林晓 · 客户跟进</small></div></div></div></section></section></>;
}

function ViewingV2({records,clients,onPick,onCreate,onComplete}:{records:ViewingRecord[];clients:Client[];onPick:(client:Client)=>void;onCreate:()=>void;onComplete:(record:ViewingRecord)=>void}) {
  return <><div className="page-heading"><div><h1>看房管理</h1><p>来自跟进环节的预约会自动进入日程；完成带看后生成客户回访任务。</p></div><button className="create" onClick={onCreate}>＋ 新建预约</button></div><div className="viewing-stats"><Metric label="待看房" value={String(records.filter(record=>record.status !== "已完成").length)} detail="来自跟进预约" tone="blue" icon="⌂"/><Metric label="待确认预约" value={String(records.filter(record=>record.status==="待确认").length)} detail="需二次确认" tone="orange" icon="!"/><Metric label="已完成带看" value={String(records.filter(record=>record.status==="已完成").length)} detail="已生成回访任务" tone="green" icon="◉"/><Metric label="待回访" value={String(clients.filter(client=>client.tags.includes("需回访")).length)} detail="同步到跟进工作台" tone="purple" icon="◷"/></div><section className="panel viewing-list"><PanelTitle title="看房日程" action="来自客户跟进" /><table><thead><tr><th>预约时间</th><th>客户</th><th>房源</th><th>带看人</th><th>状态</th><th>操作</th></tr></thead><tbody>{records.map(record=>{const client=clients.find(item=>item.id===record.clientId);return <tr key={record.id}><td><b>{record.time}</b></td><td>{client?<button className="person-link" onClick={()=>onPick(client)}><Avatar value={client.initials}/>{client.name}</button>:"历史客户"}</td><td>{record.property}</td><td>{record.agent}</td><td><Badge tone={record.status==="已完成"?"green":record.status==="已确认"?"blue":"orange"}>{record.status}</Badge></td><td>{record.status==="已完成"?<span className="green-text">已同步回访</span>:<button className="link-btn" onClick={()=>onComplete(record)}>完成看房 →</button>}</td></tr>})}</tbody></table></section></>;
}

function AppointmentFormV2({client,clients,onClientChange,onBack,onDone}:{client:Client;clients:Client[];onClientChange:(client:Client)=>void;onBack:()=>void;onDone:(client:Client,property:string,time:string)=>void}) {
  const [property,setProperty] = useState("远洋新干线 A-1208");
  const [time,setTime] = useState("2026-08-27T18:30");
  return <><div className="page-heading appointment-heading"><div><button className="back-link" onClick={onBack}>← 返回客户管理</button><h1>填写看房预约</h1><p>预约保存后，客户状态将更新为待看房，并同步创建看房日程与提醒任务。</p></div></div><div className="workflow-context"><span>业务流程</span><b>客户跟进</b><i>→</i><b className="current">预约看房</b><i>→</i><b>看房回访</b></div><section className="appointment-form panel"><div className="form-section"><h3>关联客户与房源</h3><div className="form-grid"><label className="field"><span>客户 <i>*</i></span><div><select value={client.id} onChange={event=>{const selected=clients.find(item=>item.id===Number(event.target.value)); if(selected) onClientChange(selected)}}>{clients.map(item=><option value={item.id} key={item.id}>{item.name} · {item.phone}</option>)}</select></div></label><label className="field"><span>房源 <i>*</i></span><div><input value={property} onChange={event=>setProperty(event.target.value)}/></div></label><Field label="客户预算" value={client.budget}/><Field label="带看人" value={client.owner}/></div></div><div className="form-section"><h3>预约与提醒</h3><div className="form-grid"><label className="field"><span>预约时间 <i>*</i></span><div><input type="datetime-local" value={time} onChange={event=>setTime(event.target.value)} required/></div></label><Field label="集合地点" value="房源楼下大堂"/><div className="full-field"><div className="appointment-reminders"><label><input type="checkbox" defaultChecked/> 看房前一天提醒客户</label><label><input type="checkbox" defaultChecked/> 看房前 2 小时二次确认</label><label><input type="checkbox" defaultChecked/> 同步提醒带看人</label></div></div></div></div><footer className="appointment-footer"><button onClick={onBack}>取消</button><button className="create" onClick={()=>onDone(client,property,time)}>创建预约并同步</button></footer></section></>;
}

function DealsV2({records,onEdit}:{records:DealRecord[];onEdit:(record:DealRecord)=>void}) {
  return <><div className="page-heading"><div><h1>成交管理</h1><p>仅展示从客户看房/签约流程创建的成交记录与结算进度。</p></div></div><div className="deal-stats"><Metric label="本月成交" value={String(records.length)} detail="由成交动作同步生成" tone="blue" icon="✓"/><Metric label="待结算佣金" value={String(records.filter(record=>record.status==="待结算").length)} detail="需财务处理" tone="orange" icon="◷"/><Metric label="已结算佣金" value={String(records.filter(record=>record.status==="已结算").length)} detail="已完成结算" tone="green" icon="✓"/><Metric label="成交客户" value={String(new Set(records.map(record=>record.clientId)).size)} detail="已回写客户状态" tone="purple" icon="¥"/></div><section className="panel"><div className="table-toolbar"><label>⌕<input placeholder="搜索成交编号、客户、房源"/></label><button className="export">⇩ 导出</button></div><div className="table-wrap"><table className="deal-table"><thead><tr><th>成交编号</th><th>客户</th><th>成交房源</th><th>月租金</th><th>应收佣金</th><th>结算状态</th><th>负责人</th><th>成交时间</th></tr></thead><tbody>{records.map(record=><tr key={record.id} onClick={()=>onEdit(record)}><td className="blue-text">{record.id}</td><td><b>{record.clientName}</b></td><td>{record.property}</td><td>{record.rent}</td><td><b>{record.commission}</b></td><td><Badge tone={record.status==="已结算"?"green":"orange"}>{record.status}</Badge></td><td>{record.owner}</td><td>{record.date}</td></tr>)}</tbody></table></div></section></>;
}

function DealModalV2({client,appointments,onClose,onSave}:{client:Client;appointments:ViewingRecord[];onClose:()=>void;onSave:(client:Client,property:string)=>void}) {
  const [property,setProperty] = useState(appointments[0]?.property ?? "待关联房源");
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="deal-modal" onMouseDown={event=>event.stopPropagation()}><header><div><h2>创建成交记录</h2><p>成交保存后会将客户标记为已成交，并出现在成交管理中。</p></div><button className="close" onClick={onClose}>×</button></header><div className="form-scroll"><FormSection title="关联信息"><Field label="客户" value={client.name}/><label className="field"><span>关联房源 <i>*</i></span><div><input value={property} onChange={event=>setProperty(event.target.value)}/></div></label><Field label="负责人" value={client.owner}/><Field label="成交渠道" value="平台 IM"/></FormSection><FormSection title="成交与结算"><Field label="月租金" value="8,800" suffix="元/月"/><Field label="应收佣金" value="8,800" suffix="元"/><Field label="结算状态" value="待结算"/><Field label="成交时间" value="今天"/></FormSection></div><footer><button onClick={onClose}>取消</button><button className="primary" onClick={()=>{onSave(client,property);onClose();}}>保存成交并同步</button></footer></section></div>;
}

function NewClientModalV2({onClose,onSave}:{onClose:()=>void;onSave:(client:Client)=>void}) {
  const [form,setForm] = useState({name:"",phone:"",source:"私域添加",area:"",budget:"",moveIn:"半月内",stage:"待跟进",owner:"林晓",next:"2026-08-26T18:00",notes:""});
  const [initialTags,setInitialTags] = useState<string[]>([]);
  const set = (key:keyof typeof form,value:string) => setForm(current=>({...current,[key]:value}));
  const toggle = (tag:string) => setInitialTags(current=>current.includes(tag)?current.filter(item=>item!==tag):[...current,tag]);
  const submit = (event:React.FormEvent) => { event.preventDefault(); if(!form.name.trim() || !form.phone.trim()) return; onSave({id:Date.now(),name:form.name.trim(),initials:form.name.trim().slice(0,1),phone:form.phone.trim(),stage:form.stage,area:form.area || "待补充",budget:form.budget || "待确认",moveIn:form.moveIn,next:taskTimeLabel(form.next),nextAt:form.next,owner:form.owner,viewed:false,tags:[form.source,"新客户",...initialTags],last:form.notes || "已手动创建客户档案，待首次跟进"}); };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="new-client-modal" onMouseDown={event=>event.stopPropagation()} onSubmit={submit}><header><div><h2>新增客户</h2><p>首次录入时完成客户需求、来源和初始标签标注。</p></div><button className="close" type="button" onClick={onClose}>×</button></header><div className="form-scroll">
    <FormSection title="基础信息"><label className="field"><span>客户姓名 <i>*</i></span><div><input autoFocus value={form.name} onChange={event=>set("name",event.target.value)} placeholder="请输入客户姓名" required/></div></label><label className="field"><span>手机号 <i>*</i></span><div><input value={form.phone} onChange={event=>set("phone",event.target.value)} placeholder="请输入手机号" required/></div></label><label className="field"><span>客户来源 <i>*</i></span><div><select value={form.source} onChange={event=>set("source",event.target.value)}><option>私域添加</option><option>转介绍</option><option>线下到访</option><option>平台 IM</option><option>其他渠道</option></select></div></label><label className="field"><span>企微状态</span><div><select defaultValue="已加企微"><option>已加企微</option></select></div></label><label className="field"><span>负责人</span><div><select value={form.owner} onChange={event=>set("owner",event.target.value)}><option>林晓</option><option>王磊</option><option>陈露</option></select></div></label></FormSection>
    <FormSection title="租房需求"><label className="field"><span>意向区域</span><div><input value={form.area} onChange={event=>set("area",event.target.value)} placeholder="例如：朝阳 · 望京"/></div></label><label className="field"><span>预算范围</span><div><input value={form.budget} onChange={event=>set("budget",event.target.value)} placeholder="例如：¥5,000–6,000"/></div></label><label className="field"><span>入住时间</span><div><select value={form.moveIn} onChange={event=>set("moveIn",event.target.value)}><option>一周内</option><option>半月内</option><option>一个月内</option><option>待确认</option></select></div></label><label className="field"><span>当前阶段</span><div><select value={form.stage} onChange={event=>set("stage",event.target.value)}>{columns.slice(0,3).map(item=><option key={item}>{item}</option>)}</select></div></label></FormSection>
    <FormSection title="首次待办"><label className="field"><span>下次跟进时间 <i>*</i></span><div><input type="datetime-local" value={form.next} onChange={event=>set("next",event.target.value)} required/></div></label><div className="full-field"><p className="form-hint">可通过日期与时间控件选择；保存后会立即在跟进工作台生成该客户待办，并进入应用内提醒队列。</p></div></FormSection>
    <FormSection title="初始业务标签"><div className="client-tag-picker"><p>根据首次沟通快速标注，可多选；后续可在跟进记录中调整。</p><div>{tagFilters.slice(7).map(tag=><button type="button" className={initialTags.includes(tag)?"selected":""} onClick={()=>toggle(tag)} key={tag}>#{tag}</button>)}</div></div></FormSection>
    <FormSection title="首次跟进备注"><div className="full-field"><label>备注</label><textarea value={form.notes} onChange={event=>set("notes",event.target.value)} placeholder="记录客户来源、租房偏好、沟通情况或下一步计划"/></div></FormSection>
  </div><footer><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存客户与初始标签</button></footer></form></div>;
}

function ClientDrawerV2({client,followUps,appointments,onAddFollowUp,onUpdateClient,onRecommend,onClose,onDeal,onAppointment,alert}:{client:Client;followUps:FollowUp[];appointments:ViewingRecord[];onAddFollowUp:(entry:FollowUp)=>void;onUpdateClient:(client:Client)=>void;onRecommend:()=>void;onClose:()=>void;onDeal:()=>void;onAppointment:()=>void;alert:(x:string)=>void}) {
  const [tab,setTab] = useState("跟进记录");
  const [adding,setAdding] = useState(false);
  const initial: FollowUp[] = [{time:"今天 14:12",title:"平台 IM 进线",desc:"客户发起咨询，等待确认需求。"}];
  const recommendedProperties = [{name:"精装一居 · 近地铁",area:client.area,price:client.budget,spec:"一室一厅 · 押一付三"},{name:"业主直租 · 拎包入住",area:client.area,price:client.budget,spec:"一室一厅 · 精装修"},{name:"高性价比 · 通勤便利",area:client.area,price:"较预算低 500 元",spec:"开间 · 押一付一"}];
  const clientViewings = appointments.filter(a=>a.clientId===client.id);
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="drawer" onMouseDown={event=>event.stopPropagation()}><header><div className="drawer-person"><Avatar value={client.initials} large/><div><h2>{client.name} <Badge>{client.stage}</Badge></h2><p>{client.phone}　·　{client.owner} 负责</p></div></div><button className="close" onClick={onClose}>×</button></header>
    <div className="drawer-info"><span>下次跟进 <b className="blue-text">{client.next}</b></span><span>意向区域 <b>{client.area}</b></span><span>预算 <b>{client.budget}</b></span></div>
    <div className="drawer-actions"><button className="primary" onClick={()=>setAdding(true)}>＋ 新增跟进</button><button onClick={onRecommend}>推荐房源</button><button onClick={onAppointment}>预约看房</button><button onClick={onDeal}>创建成交</button></div>
    <section className="drawer-tags"><div><b>业务标签</b><small>在“新增跟进”中维护，保存后自动同步到客户筛选。</small></div><div>{client.tags.map(tag=><span key={tag}>#{tag}</span>)}<button onClick={()=>setAdding(true)}>编辑标签</button></div></section>
    <div className="drawer-tabs">{["跟进记录","需求档案","推荐房源","看房记录"].map(x=><button className={tab===x?"active-tab":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>
    {tab==="跟进记录" ? <><div className="next-card"><div><span>下一步待办</span><b>{client.stage}</b><p>请在 {client.next} 前完成跟进</p></div><button onClick={client.stage === "待看房" ? onAppointment : ()=>setAdding(true)}>{client.stage === "待看房" ? "填写预约" : "完成跟进"}</button></div><div className="timeline">{[...followUps,...initial].map((item,index)=><div className="timeline-item" key={index}><i className={index===0?"now":""}></i><small>{item.time}</small><b>{item.title}</b><p>{item.desc}</p></div>)}</div></> : tab==="需求档案" ? <div className="detail-section"><div className="detail-row"><span>意向区域</span><b>{client.area}</b></div><div className="detail-row"><span>预算范围</span><b>{client.budget}</b></div><div className="detail-row"><span>入住时间</span><b>{client.moveIn}</b></div><div className="detail-row"><span>下次跟进</span><b>{client.next}</b></div><div className="detail-row"><span>负责人</span><b>{client.owner}</b></div></div> : tab==="推荐房源" ? <div className="detail-section">{recommendedProperties.map((p,i)=><div className="property-card" key={i}><div><b>{p.name}</b><small>{p.area}</small></div><div><span>{p.price}</span><span>{p.spec}</span></div></div>)}</div> : <div className="detail-section">{clientViewings.length ? clientViewings.map(a=><div className="viewing-record" key={a.id}><div><b>{a.time}</b><small>{a.status}</small></div><p>{a.property}</p><small>带看：{a.agent}</small></div>) : <p className="empty-text">暂无看房记录</p>}</div>}
    {adding && <FollowUpModalV2 client={client} onClose={()=>setAdding(false)} onSave={(desc,tags,stage,nextAt,result,reason)=>{onAddFollowUp({time:"刚刚",title:"林晓 · 跟进记录",desc, result, reason}); onUpdateClient({...client,tags:Array.from(new Set([...tags,"已加企微", ...(result.includes("不合适")?["房子不合适","二次推荐"]:[]), ...(result.includes("待预约")?["待预约"]:[])])),stage:result.includes("不合适")?"待推荐":result.includes("待预约")?"待看房":stage,next:taskTimeLabel(nextAt),nextAt,last:reason?`${desc}（原因：${reason}）`:desc}); setAdding(false); alert("跟进结果已同步至客户管理、跟进工作台与提醒队列");}} onAppointment={onAppointment} />}
  </aside></div>;
}

function FollowUpModalV2({client,onClose,onSave,onAppointment}:{client:Client;onClose:()=>void;onSave:(desc:string,tags:string[],stage:string,nextAt:string,result:string,reason?:string)=>void;onAppointment:()=>void}) {
  const [content,setContent] = useState("");
  const [result,setResult] = useState("已联系，等待客户反馈");
  const [selectedTags,setSelectedTags] = useState(client.tags);
  const [stage,setStage] = useState(client.stage);
  const [next,setNext] = useState("2026-08-27T10:00");
  const [reason,setReason] = useState("房子本身装修/格局不合适");
  const availableTags = tagFilters.slice(7);
  const toggleTag = (tag:string) => setSelectedTags(current => current.includes(tag) ? current.filter(item=>item!==tag) : [...current,tag]);
  return <div className="followup-backdrop" onMouseDown={onClose}><form className="followup-modal" onMouseDown={event=>event.stopPropagation()} onSubmit={event=>{event.preventDefault(); onSave(content.trim() || "已完成客户跟进，并设置了下一步处理计划。",selectedTags,stage,next,result,result.includes("不合适") ? reason : undefined); if(result.includes("待预约") || result.includes("安排带看")) onAppointment();}}><header><div><h3>新增跟进记录</h3><p>{client.name} · 保存后同步客户状态、标签与下次待办</p></div><button type="button" className="close" onClick={onClose}>×</button></header>
    <label><span>本次跟进结果 <i>*</i></span><select value={result} onChange={event=>setResult(event.target.value)}><option>已联系，等待客户反馈</option><option>已确认需求，待推荐房源</option><option>客户有意向，待预约看房</option><option>仅浏览用户，安排带看</option><option>已收藏用户，安排带看</option><option>房子不合适，二次推荐</option><option>客户暂缓，后续唤醒</option><option>别处成交</option><option>无法联系客户</option></select></label>
    {result.includes("不合适") && <label><span>未成交原因</span><select value={reason} onChange={event=>setReason(event.target.value)}><option>房子本身装修/格局不合适</option><option>价格与预算不匹配</option><option>通勤距离不合适</option><option>其他不可控因素</option></select></label>}
    <label><span>跟进内容 <i>*</i></span><textarea autoFocus value={content} onChange={event=>setContent(event.target.value)} placeholder="记录客户的最新反馈、需求变化或下一步计划。" required /></label>
    <div className="followup-tag-field"><span>业务标签</span><small>可多选；用于客户管理页的快速筛选。</small><div>{availableTags.map(tag=><button type="button" className={selectedTags.includes(tag)?"selected":""} onClick={()=>toggleTag(tag)} key={tag}>#{tag}</button>)}</div></div>
    <div className="followup-grid"><label><span>更新客户状态</span><select value={stage} onChange={event=>setStage(event.target.value)}>{columns.map(item=><option key={item}>{item}</option>)}</select></label><label><span>下次跟进时间 <i>*</i></span><input type="datetime-local" value={next} onChange={event=>setNext(event.target.value)} required /></label></div>
    <footer><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">{result.includes("待预约") || result.includes("安排带看") ? "保存并填写预约" : "保存并同步标签"}</button></footer>
  </form></div>;
}

function ReminderSettingsModal({rules,onChange,onClose}:{rules:ReminderRules;onChange:(rules:ReminderRules)=>void;onClose:()=>void}) {
  const options: Array<[keyof ReminderRules,string,string]> = [
    ["firstResponse","首响超时","新进线 5 分钟内未首次响应"],
    ["recommendation","推荐跟进","推荐房源后 12 小时未跟进"],
    ["viewingFollowup","看房后回访","看房完成后 2 小时未记录回访"],
    ["viewingConfirmation","预约确认","看房前 2 小时未完成二次确认"],
  ];
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="reminder-modal" onMouseDown={event=>event.stopPropagation()}><header><div><h2>待办提醒规则</h2><p>启用或停用后，工作台风险数与超时队列会立即同步。</p></div><button className="close" onClick={onClose}>×</button></header><div className="reminder-rule-list">{options.map(([key,title,description])=><label key={key}><div><b>{title}</b><span>{description}</span></div><input type="checkbox" checked={rules[key]} onChange={event=>onChange({...rules,[key]:event.target.checked})}/><i>{rules[key] ? "已启用" : "已停用"}</i></label>)}</div><footer><button onClick={onClose}>取消</button><button className="primary" onClick={onClose}>保存规则</button></footer></section></div>;
}
