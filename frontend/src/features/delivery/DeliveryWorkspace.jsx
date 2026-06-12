import { AlertTriangle, Clock, Download, Search } from "lucide-react";
import { useState } from "react";

import { getDeliveries, getDelivery, saveSelection } from "../../api/client";
import { SectionHeader } from "../../components/SectionHeader";

function getDaysRemaining(expiresAt) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expire = new Date(expiresAt);
  expire.setHours(0, 0, 0, 0);
  const diff = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getExpiryBadge(daysRemaining) {
  if (daysRemaining < 0) {
    return { text: "已过期", variant: "expired" };
  }
  if (daysRemaining === 0) {
    return { text: "今日到期", variant: "urgent" };
  }
  if (daysRemaining <= 3) {
    return { text: `剩余 ${daysRemaining} 天`, variant: "urgent" };
  }
  if (daysRemaining <= 7) {
    return { text: `剩余 ${daysRemaining} 天`, variant: "warning" };
  }
  return { text: `剩余 ${daysRemaining} 天`, variant: "normal" };
}

export function DeliveryWorkspace({ deliveries, onDeliveriesChange }) {
  const [code, setCode] = useState("STUDIO-2026-0618");
  const [delivery, setDelivery] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState("");

  async function loadDelivery(event) {
    event.preventDefault();
    setMessage("");

    try {
      const data = await getDelivery(code);
      setDelivery(data);
      setSelectedIds(data.photos.filter((photo) => photo.selected).map((photo) => photo.id));
    } catch (error) {
      setDelivery(null);
      setMessage(error.message);
    }
  }

  function togglePhoto(photoId) {
    setSelectedIds((current) =>
      current.includes(photoId) ? current.filter((item) => item !== photoId) : [...current, photoId],
    );
  }

  async function submitSelection() {
    const result = await saveSelection({ code: delivery.code, photoIds: selectedIds });
    setMessage(result.message);
    const summary = await getDeliveries();
    onDeliveriesChange(summary);
  }

  return (
    <section className="section" id="delivery">
      <SectionHeader
        eyebrow="客片交付与在线选片"
        title="通过交付码查看照片并保存精修选择"
        description="示例交付码已填入，可直接查看在线选片流程。"
      />

      <div className="delivery-layout">
        <aside className="delivery-sidebar">
          <form className="lookup-form" onSubmit={loadDelivery}>
            <label>
              交付码
              <input value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <button className="button button-primary" type="submit">
              <Search size={18} />
              查询交付
            </button>
          </form>

          <div className="summary-list">
            {deliveries.map((item) => {
              const daysRemaining = getDaysRemaining(item.expiresAt);
              const badge = getExpiryBadge(daysRemaining);
              return (
                <button
                  className={`summary-item summary-${badge.variant}`}
                  key={item.code}
                  onClick={() => setCode(item.code)}
                  type="button"
                >
                  <div className="summary-main">
                    <strong>{item.title}</strong>
                    <span>{item.client}</span>
                    <small>
                      {item.selectedCount}/{item.photoCount} 已选
                    </small>
                  </div>
                  <div className={`expiry-badge expiry-${badge.variant}`}>
                    {badge.variant === "urgent" || badge.variant === "expired" ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    <span>{badge.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="gallery-panel">
          {delivery ? (
            <>
              <div className="gallery-toolbar">
                <div>
                  <h3>{delivery.title}</h3>
                  <p>
                    {delivery.client} · {delivery.status} · 精修上限 {delivery.retouchLimit} 张
                  </p>
                  {(() => {
                    const daysRemaining = getDaysRemaining(delivery.expiresAt);
                    const badge = getExpiryBadge(daysRemaining);
                    return (
                      <div className={`expiry-notice expiry-${badge.variant}`}>
                        {badge.variant === "urgent" || badge.variant === "expired" ? (
                          <AlertTriangle size={16} />
                        ) : (
                          <Clock size={16} />
                        )}
                        <span>
                          有效期至 {delivery.expiresAt}（{badge.text}）
                          {badge.variant === "urgent" && "，请尽快完成选片！"}
                          {badge.variant === "expired" && "，无法再进行选片操作。"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <button className="button button-ghost" type="button">
                  <Download size={18} />
                  下载底片
                </button>
              </div>
              <div className="photo-grid">
                {delivery.photos.map((photo) => (
                  <button
                    className={`photo-tile ${selectedIds.includes(photo.id) ? "selected" : ""}`}
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    type="button"
                  >
                    <img src={photo.url} alt={`客片 ${photo.id}`} />
                    <span>{selectedIds.includes(photo.id) ? "已选择" : "待选择"}</span>
                  </button>
                ))}
              </div>
              <div className="selection-bar">
                <span>
                  已选择 {selectedIds.length} / {delivery.retouchLimit} 张
                </span>
                <button className="button button-primary" onClick={submitSelection} type="button">
                  保存选片
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">输入交付码后查看客片与选片状态。</div>
          )}
          {message && <div className="notice">{message}</div>}
        </div>
      </div>
    </section>
  );
}
