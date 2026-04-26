import React, { useState } from "react";
import { Modal } from './atoms.jsx';

export function ReorderModal({ item, type, suggestedQty, unit, onConfirm, onClose }) {
    const [qty, setQty] = useState(suggestedQty);
    const minOrder = item.minQty || item.minStock || 1;
    const currentQty = item.qty || 0;

    return (
        <Modal title={`Reorder: ${item.name}`} onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                <button className="btn btp bts" onClick={() => onConfirm(qty)} disabled={qty < 1}>Add to Reorder</button></>
        )}>
            <div style={{ marginBottom: 16 }}>
                <div className="rowsb mb8">
                    <span className="tiny dim">Current Stock</span>
                    <span style={{ fontFamily: "var(--fd)", fontWeight: 700 }}>{currentQty} {unit}</span>
                </div>
                <div className="rowsb mb8">
                    <span className="tiny dim">Minimum Level</span>
                    <span style={{ fontFamily: "var(--fd)", fontWeight: 700 }}>{minOrder} {unit}</span>
                </div>
                <div className="rowsb mb12">
                    <span className="tiny dim">Suggested Order</span>
                    <span style={{ fontFamily: "var(--fd)", fontWeight: 700, color: "var(--accent)" }}>{suggestedQty} {unit}</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <label className="fl">Order Quantity ({unit})</label>
                    <input 
                        type="number" 
                        className="fi" 
                        min={1} 
                        value={qty} 
                        onChange={e => setQty(parseInt(e.target.value) || 1)} 
                    />
                    <div className="tiny dim mt4">How many units do you want to order?</div>
                </div>
            </div>
        </Modal>
    );
}
