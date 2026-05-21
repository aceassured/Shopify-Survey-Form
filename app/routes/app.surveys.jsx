import { useLoaderData } from "react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import prisma from "../db.server";

export async function loader() {
  const surveys = await prisma.surveyResponse.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { surveys };
}

const SOURCE_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  youtube: "YouTube",
  reddit: "Reddit",
  ai_recommendation: "AI Recommendation",
  tiktok: "TikTok",
  friend_referral: "Friend / Referral",
  retail_store: "Retail Store",
  amazon: "Amazon",
};

const SOURCE_COLORS = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  google: "#4285F4",
  youtube: "#FF0000",
  reddit: "#FF4500",
  ai_recommendation: "#7C3AED",
  tiktok: "#525252",
  friend_referral: "#059669",
  retail_store: "#D97706",
  amazon: "#FF9900",
};

function ScriptLoader({ src, onLoad }) {
  useEffect(() => {
    if (window.Chart) { onLoad?.(); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => onLoad?.());
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => onLoad?.();
    document.head.appendChild(s);
  }, []);
  return null;
}

// Inject ShopifySans font directly so it always loads
function FontInjector() {
  useEffect(() => {
    if (document.getElementById("shopify-sans-font")) return;
    const style = document.createElement("style");
    style.id = "shopify-sans-font";
    style.textContent = `
      @font-face {
        font-family: 'ShopifySans';
        src: url('https://cdn.shopify.com/static/fonts/ShopifySans--regular.woff2') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'ShopifySans';
        src: url('https://cdn.shopify.com/static/fonts/ShopifySans--medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'ShopifySans';
        src: url('https://cdn.shopify.com/static/fonts/ShopifySans--bold.woff2') format('woff2');
        font-weight: 600 700;
        font-style: normal;
      }
      .survey-dash * {
        font-family: 'ShopifySans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}

export default function SurveysPage() {
  const { surveys } = useLoaderData();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [surveyType, setSurveyType] = useState("all");

  const filteredSurveys = useMemo(() => {
    let filtered = [...surveys];
    if (search) {
      filtered = filtered.filter((s) => {
        const v = search.toLowerCase();
        return (
          s.customerName?.toLowerCase().includes(v) ||
          s.customerEmail?.toLowerCase().includes(v) ||
          s.orderId?.toLowerCase().includes(v)
        );
      });
    }
    if (surveyType !== "all") {
      filtered = filtered.filter((s) => s.source === surveyType);
    }
    filtered.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );
    return filtered;
  }, [surveys, search, sortOrder, surveyType]);

  const analytics = useMemo(() => {
    const counts = {};
    Object.keys(SOURCE_LABELS).forEach((key) => {
      counts[key] = surveys.filter((s) => s.source === key).length;
    });
    return { total: surveys.length, ...counts };
  }, [surveys]);

  function getOrderNumber(orderId) {
    if (!orderId) return null;
    const parts = orderId.split("/");
    return `#${parts[parts.length - 1]}`;
  }

  function getOrderAdminUrl(survey) {
    if (!survey.orderId || !survey.shop) return "#";
    const parts = survey.orderId.split("/");
    const numericId = parts[parts.length - 1];
    return `https://admin.shopify.com/store/${survey.shop.replace(".myshopify.com", "")}/orders/${numericId}`;
  }

  return (
    <>
      <FontInjector />
      <div className="survey-dash" style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f1f1f1",
        padding: "20px",
        boxSizing: "border-box",
      }}>

        {/* Page title */}
        <h1 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "700", color: "#202223", letterSpacing: "-0.02em" }}>
          Survey Dashboard
        </h1>

        {/* ── Top row ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 310px",
          gap: "16px",
          alignItems: "stretch",
          width: "100%",
          boxSizing: "border-box",
        }}>

          {/* Table card */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e3e5" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#202223" }}>Survey Results</p>
            </div>

            <div style={{
              padding: "12px 20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              borderBottom: "1px solid #e1e3e5",
              background: "#fafbfb",
            }}>
              <input
                type="text"
                placeholder="Search customer or order"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inp, flex: "1", minWidth: "180px" }}
              />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={sel}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <select value={surveyType} onChange={(e) => setSurveyType(e.target.value)} style={sel}>
                <option value="all">All Sources</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f6f6f7" }}>
                    {["Order", "Date", "Customer", "Email", "Source", "Shop"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "#8c9196", fontSize: "14px" }}>
                        No results found
                      </td>
                    </tr>
                  ) : filteredSurveys.map((survey, i) => {
                    const orderNum = getOrderNumber(survey.orderId);
                    return (
                      <tr key={survey.id} style={{ borderBottom: i !== filteredSurveys.length - 1 ? "1px solid #f1f1f1" : "none" }}>
                        <td style={td}>
                          {orderNum ? (
                            <a href={getOrderAdminUrl(survey)} target="_blank" rel="noreferrer"
                              style={{ color: "#005bd3", textDecoration: "none", fontWeight: "600" }}>
                              {orderNum}
                            </a>
                          ) : <span>-</span>}
                        </td>
                        <td style={td}>{new Date(survey.createdAt).toLocaleDateString()}</td>
                        <td style={td}>{survey.customerName || "-"}</td>
                        <td style={td}>{survey.customerEmail || "-"}</td>
                        <td style={td}>{SOURCE_LABELS[survey.source] || survey.source?.replaceAll("_", " ") || "-"}</td>
                        <td style={td}>{survey.shop || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown card */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e1e3e5" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#6d7175" }}>Total responses</p>
              <p style={{ margin: "3px 0 0", fontSize: "28px", fontWeight: "700", color: "#202223", lineHeight: 1 }}>
                {analytics.total}
              </p>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {Object.entries(SOURCE_LABELS).map(([key, label], i, arr) => {
                const count = analytics[key] ?? 0;
                const pct = analytics.total > 0 ? ((count / analytics.total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={key} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 20px",
                    borderBottom: i !== arr.length - 1 ? "1px solid #f1f1f1" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: SOURCE_COLORS[key], flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#005bd3" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#202223" }}>{count}</span>
                      <span style={{ fontSize: "12px", color: "#8c9196", minWidth: "36px", textAlign: "right" }}>{pct}%</span>
                      <span style={{ fontSize: "12px", color: "#c9cccf" }}>—</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom charts ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <BarChartCard analytics={analytics} />
          <DonutChartCard analytics={analytics} />
        </div>

      </div>
    </>
  );
}

function BarChartCard({ analytics }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.Chart);

  const sourceKeys = Object.keys(SOURCE_LABELS);
  const data = sourceKeys.map((k) => analytics[k] ?? 0);
  const labels = sourceKeys.map((k) => SOURCE_LABELS[k]);
  const colors = sourceKeys.map((k) => SOURCE_COLORS[k]);

  function buildChart() {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Responses", data, backgroundColor: colors.map((c) => c + "cc"), borderColor: colors, borderWidth: 1.5, borderRadius: 5 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} responses` } } },
        scales: {
          x: { ticks: { font: { size: 10 }, maxRotation: 40, autoSkip: false }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { font: { size: 11 }, stepSize: 1 }, grid: { color: "#f1f1f1" } },
        },
      },
    });
  }

  useEffect(() => { if (ready) buildChart(); return () => chartRef.current?.destroy(); }, [ready, JSON.stringify(analytics)]);

  return (
    <div style={card}>
      <ScriptLoader src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onLoad={() => setReady(true)} />
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e1e3e5" }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#202223" }}>Responses by source</p>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ position: "relative", height: "260px", width: "100%" }}>
          <canvas ref={canvasRef} role="img" aria-label="Bar chart of survey responses by source" />
        </div>
      </div>
    </div>
  );
}

function DonutChartCard({ analytics }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.Chart);

  const sourceKeys = Object.keys(SOURCE_LABELS).filter((k) => (analytics[k] ?? 0) > 0);
  const data = sourceKeys.map((k) => analytics[k] ?? 0);
  const labels = sourceKeys.map((k) => SOURCE_LABELS[k]);
  const colors = sourceKeys.map((k) => SOURCE_COLORS[k]);
  const total = data.reduce((a, b) => a + b, 0);

  function buildChart() {
    if (!canvasRef.current || !window.Chart) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new window.Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.map((c) => c + "cc"), borderColor: "#fff", borderWidth: 2, hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "66%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => { const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : "0"; return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`; } } },
        },
      },
    });
  }

  useEffect(() => { if (ready) buildChart(); return () => chartRef.current?.destroy(); }, [ready, JSON.stringify(analytics)]);

  return (
    <div style={card}>
      <ScriptLoader src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onLoad={() => setReady(true)} />
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #e1e3e5" }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#202223" }}>Source distribution</p>
      </div>
      <div style={{ padding: "20px", display: "flex", gap: "24px", alignItems: "center" }}>
        <div style={{ position: "relative", width: "170px", height: "170px", flexShrink: 0 }}>
          <canvas ref={canvasRef} role="img" aria-label="Donut chart of source distribution" />
          {total === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#8c9196" }}>No data</div>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          {sourceKeys.map((key) => {
            const count = analytics[key] ?? 0;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: SOURCE_COLORS[key], flexShrink: 0 }} />
                <span style={{ color: "#6d7175", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{SOURCE_LABELS[key]}</span>
                <span style={{ fontWeight: "600", color: "#202223", minWidth: "36px", textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const card = {
  background: "#ffffff",
  border: "1px solid #e1e3e5",
  borderRadius: "12px",
  overflow: "hidden",
  width: "100%",
  boxSizing: "border-box",
};

const inp = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #c9cccf",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const sel = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #c9cccf",
  fontSize: "14px",
  background: "#ffffff",
  cursor: "pointer",
  outline: "none",
};

const th = {
  textAlign: "left",
  padding: "11px 16px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#6d7175",
  whiteSpace: "nowrap",
};

const td = {
  padding: "13px 16px",
  fontSize: "14px",
  color: "#202223",
  whiteSpace: "nowrap",
};