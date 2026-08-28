"use client";

import { useMemo, useState } from "react";
import "./analytics-dashboard.css";

type ClientRecord = {
  id: number;
  name: string;
  stage: string;
  viewed: boolean;
  tags: string[];
  next: string;
  nextAt?: string;
  owner: string;
};

type DealRecord = { clientId: number; clientName: string; status: string };
type ViewingRecord = { clientId: number; status: string };
type FollowUpRecord = { title: string; kind?: "system" | "followup" };

type Props = {
  clients: ClientRecord[];
  deals: DealRecord[];
  viewings: ViewingRecord[];
  followUps: Record<number, FollowUpRecord[]>;
};

const isManualFollowUp = (item: FollowUpRecord) => item.kind === "followup" || (item.kind !== "system" && !item.title.includes("建立客户档案"));
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;
const stageOrder = ["待跟进", "待推荐", "待看房", "已成交"];

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article className={`analysis-stat ${tone}`}><span>{label}</span><b>{value}</b><small>{detail}</small></article>;
}

function BarList({ rows }: { rows: Array<[string, number, number, string?]> }) {
  return <div className="analysis-bar-list">{rows.map(([label, value, width, note]) => <div key={label}><header><span>{label}</span><b>{value}</b>{note && <small>{note}</small>}</header><i><em style={{ width: `${Math.max(width, value ? 4 : 0)}%` }} /></i></div>)}</div>;
}

export default function AnalyticsDashboard({ clients, deals, viewings, followUps }: Props) {
  const [activeTab, setActiveTab] = useState("转化漏斗");
  const [range, setRange] = useState("本月");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [from, setFrom] = useState("2026-08-01");
  const [to, setTo] = useState("2026-08-28");

  const metrics = useMemo(() => {
    const total = clients.length;
    const manualCounts = clients.map(client => (followUps[client.id] ?? []).filter(isManualFollowUp).length);
    const followUpTotal = manualCounts.reduce((sum, count) => sum + count, 0);
    const contactedIds = new Set(clients.filter((client, index) => client.stage !== "待跟进" || manualCounts[index] > 0).map(client => client.id));
    const recommendedIds = new Set(clients.filter(client => ["待推荐", "待看房", "已成交"].includes(client.stage) || client.viewed).map(client => client.id));
    const viewedIds = new Set(clients.filter(client => client.viewed).map(client => client.id));
    viewings.filter(item => item.status === "已完成").forEach(item => viewedIds.add(item.clientId));
    const appointmentIds = new Set<number>([...viewedIds]);
    viewings.forEach(item => appointmentIds.add(item.clientId));
    clients.filter(client => ["待看房", "已成交"].includes(client.stage)).forEach(client => appointmentIds.add(client.id));
    const dealIds = new Set(clients.filter(client => client.stage === "已成交").map(client => client.id));
    deals.forEach(deal => {
      const linked = clients.find(client => client.id === deal.clientId || client.name === deal.clientName);
      if (linked) dealIds.add(linked.id);
    });
    const overdue = clients.filter(client => client.stage !== "已成交" && (client.next.includes("超时") || Boolean(client.nextAt && new Date(client.nextAt).getTime() < Date.now()))).length;
    const today = clients.filter(client => client.stage !== "已成交" && client.next.includes("今天")).length;
    const completedViewings = viewings.filter(item => item.status === "已完成").length;
    const lossLabels = ["预算不匹配", "没有合适房源", "房子不合适", "暂无需求", "客户未回复", "别处成交"];
    const losses: Array<[string, number]> = lossLabels.map(label => [label, clients.filter(client => client.tags.includes(label)).length]).filter(([, count]) => count > 0);
    const riskClients = clients.filter(client => client.stage !== "已成交" && lossLabels.some(label => client.tags.includes(label)));
    return { total, followUpTotal, contacted: contactedIds.size, recommended: recommendedIds.size, appointed: appointmentIds.size, viewed: viewedIds.size, dealClients: dealIds.size, overdue, today, completedViewings, losses, riskClients };
  }, [clients, deals, followUps, viewings]);

  const rangeLabel = range === "自定义" ? `${from.replaceAll("-", ".")} – ${to.replaceAll("-", ".")}` : range;
  const funnel: Array<[string, number]> = [["进入客户库", metrics.total], ["已完成跟进", metrics.contacted], ["进入待推荐", metrics.recommended], ["已预约看房", metrics.appointed], ["完成看房", metrics.viewed], ["完成成交", metrics.dealClients]];
  const biggestDrop = funnel.slice(1).map((row, index) => ({ from: funnel[index][0], to: row[0], loss: funnel[index][1] - row[1] })).sort((a, b) => b.loss - a.loss)[0];
  const stageRows: Array<[string, number, number, string]> = stageOrder.map(stage => {
    const count = clients.filter(client => client.stage === stage).length;
    return [stage, count, percent(count, metrics.total), `${percent(count, metrics.total)}%`];
  });
  const tabStats = activeTab === "转化漏斗"
    ? [["客户库", String(metrics.total), "客户管理实时数据", "blue"], ["已完成跟进", String(metrics.contacted), `覆盖率 ${percent(metrics.contacted, metrics.total)}%`, "purple"], ["完成看房", String(metrics.viewed), `实看率 ${percent(metrics.viewed, metrics.total)}%`, "orange"], ["已成交客户", String(metrics.dealClients), `成交率 ${percent(metrics.dealClients, metrics.total)}%`, "green"]]
    : activeTab === "过程效率"
      ? [["跟进记录", String(metrics.followUpTotal), "保存后实时累计", "blue"], ["当前超时", String(metrics.overdue), "需优先处理", "red"], ["今日待办", String(metrics.today), "来自下次跟进时间", "orange"], ["预约完成率", `${percent(metrics.completedViewings, viewings.length)}%`, `${metrics.completedViewings}/${viewings.length} 场`, "green"]]
      : [["未成交客户", String(Math.max(metrics.total - metrics.dealClients, 0)), "仍在转化链路", "blue"], ["风险客户", String(metrics.riskClients.length), "包含明确阻塞原因", "red"], ["看房未成交", String(Math.max(metrics.viewed - metrics.dealClients, 0)), "需回访或二次推荐", "orange"], ["风险识别率", `${percent(metrics.riskClients.length, Math.max(metrics.total - metrics.dealClients, 0))}%`, "按业务标签识别", "purple"]];

  return <>
    <div className="page-heading analytics-heading"><div><h1>数据分析</h1><p>用同一份客户、跟进、看房与成交数据定位转化问题</p></div><div className="analytics-actions"><button className="definition-button" onClick={() => window.alert("数据口径：客户以客户管理为准；跟进取保存记录；预约取看房管理；成交仅统计已关联客户的成交记录。")}>数据口径</button><div className="date-filter"><button className="date-pick" onClick={() => setRangeOpen(value => !value)}>⌚ {rangeLabel} <b>▾</b></button>{rangeOpen && <div className="date-menu"><p>快捷时段</p>{["本周", "本月", "本季度", "本年"].map(item => <button className={range === item ? "active" : ""} key={item} onClick={() => { setRange(item); setRangeOpen(false); }}>{item}<span>业务数据快照</span></button>)}<div className="custom-range"><p>自定义时段</p><label>开始日期<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>结束日期<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label><button className="primary" onClick={() => { setRange("自定义"); setRangeOpen(false); }}>应用筛选</button></div></div>}</div></div></div>
    <div className="analysis-tabs">{["转化漏斗", "过程效率", "流失分析"].map(tab => <button className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>
    <div className="analysis-caption"><b>实时联动</b>　{rangeLabel}　·　{activeTab}　·　新增客户及后续业务操作会自动更新</div>
    <div className="analysis-stat-grid">{tabStats.map(([label, value, detail, tone]) => <Stat key={label} label={label} value={value} detail={detail} tone={tone} />)}</div>

    {activeTab === "转化漏斗" && <div className="analysis-layout"><section className="analysis-card span-two"><header><div><span>FULL FUNNEL</span><h2>客户全链路转化漏斗</h2></div><small>按关联客户去重</small></header><div className="live-funnel">{funnel.map(([label, value], index) => { const previous = index ? funnel[index - 1][1] : value; return <div key={label}><span>{label}</span><i style={{ width: `${Math.max(30, 100 - index * 11)}%` }}><b>{value}</b><small>{index ? `环节转化 ${percent(value, previous)}%` : "100% 进入客户库"}</small></i><em>{percent(value, metrics.total)}%<small>整体</small></em></div>; })}</div></section><section className="analysis-card"><header><div><span>CONVERSION</span><h2>关键环节转化率</h2></div></header><BarList rows={funnel.slice(1).map(([label, value], index) => [funnel[index][0] + " → " + label, value, percent(value, funnel[index][1]), `${percent(value, funnel[index][1])}%`])} /><div className="analysis-insight"><b>最大流失环节</b><span>{biggestDrop?.from} → {biggestDrop?.to}</span><small>流失 {biggestDrop?.loss ?? 0} 位客户</small></div></section></div>}

    {activeTab === "过程效率" && <div className="analysis-layout"><section className="analysis-card span-two"><header><div><span>WORKLOAD</span><h2>当前阶段库存与工作负载</h2></div><small>客户状态实时更新</small></header><BarList rows={stageRows} /></section><section className="analysis-card"><header><div><span>REMINDER HEALTH</span><h2>提醒任务健康度</h2></div></header><div className="efficiency-grid"><div><b>{metrics.overdue}</b><span>已超时</span></div><div><b>{metrics.today}</b><span>今日到期</span></div><div><b>{(metrics.followUpTotal / Math.max(metrics.contacted, 1)).toFixed(1)}</b><span>人均跟进次数</span></div><div><b>{viewings.length - metrics.completedViewings}</b><span>待完成看房</span></div></div><p className="analysis-note">保存新的跟进记录后，跟进次数、客户阶段和超时提醒会同步刷新。</p></section></div>}

    {activeTab === "流失分析" && <div className="analysis-layout"><section className="analysis-card span-two"><header><div><span>LOSS REASONS</span><h2>未成交主要原因</h2></div><small>来自客户业务标签</small></header>{metrics.losses.length ? <BarList rows={metrics.losses.map(([label, value]) => [label, value, percent(value, metrics.riskClients.length), `${percent(value, metrics.riskClients.length)}%`])} /> : <div className="analytics-empty">暂无已标注的流失原因</div>}</section><section className="analysis-card"><header><div><span>ACTION LIST</span><h2>优先挽回客户</h2></div><small>{metrics.riskClients.length} 人</small></header><div className="risk-client-list">{metrics.riskClients.slice(0, 6).map(client => <div key={client.id}><span>{client.name}</span><b>{client.stage}</b><small>{client.tags.find(tag => ["预算不匹配", "没有合适房源", "房子不合适", "暂无需求", "客户未回复", "别处成交"].includes(tag))}</small></div>)}{!metrics.riskClients.length && <div className="analytics-empty">暂无风险客户</div>}</div></section></div>}
  </>;
}
