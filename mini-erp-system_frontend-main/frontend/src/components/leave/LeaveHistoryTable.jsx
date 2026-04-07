import React, { useEffect, useState } from 'react';
// 04.06 수정 

const LeaveHistoryTable = ({ historyData = [], onCancel }) => {

    const leaveTypeLabels = {
        'ANNUAL': '연차',
        'HALF_MORNING': '오전 반차',
        'HALF_AFTERNOON': '오후 반차',
    };

    // 상태에 따른 배지 색상 결정 함수
    const getStatusStyle = (status) => {
        switch (status) {
            case '승인': 
            case 'APPROVED': return { bg: '#eefaf3', color: '#2ecc71', text: '승인' };
            case '대기중': 
            case 'PENDING': return { bg: '#fff9e6', color: '#f1c40f', text: '대기중' };
            case '반려': 
            case 'REJECTED': return { bg: '#fdf2f2', color: '#e74c3c', text: '반려' };
            case '취소':
            case 'CANCELLED': return { bg: '#f5f5f5', color: '#999', text: '취소' };
            default: return { bg: '#f5f5f5', color: '#888', text: status };
        }
    };

    const sortedHistory = [...historyData].reverse();

    return (
        <div style={styles.container}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.theadRow}>
                        <th style={styles.th}>신청일</th>
                        <th style={styles.th}>연차 유형</th>
                        <th style={styles.th}>시작일</th>
                        <th style={styles.th}>종료일</th>
                        <th style={styles.th}>일수</th>
                        <th style={styles.th}>사유</th>
                        <th style={styles.th}>상태</th>
                        <th style={styles.th}>비고</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedHistory.length > 0 ? (
                        sortedHistory.map((item) => {
                            const statusInfo = getStatusStyle(item.appStatus);
                            return (
                                <tr key={item.appId} style={styles.tr}>
                                    <td style={styles.td}>{item.createdAt?.split('T')[0] || '-'}</td>
                                    <td style={styles.td}>{leaveTypeLabels[item.appType] || item.appType}</td>
                                    <td style={styles.td}>{item.startDate}</td>
                                    <td style={styles.td}>{item.endDate}</td>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>{item.usedDays}일</td>
                                    <td style={styles.td}>{item.requestReason}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.badge,
                                            backgroundColor: statusInfo.bg,
                                            color: statusInfo.color
                                        }}>
                                            {statusInfo.text}
                                        </span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'left' }}>
                                    {/* 반려 시 사유 표시 */}
                                    {item.appStatus === 'REJECTED' && (
                                        <div style={{fontSize: '12px', color: '#e74c3c', marginBottom: '4px'}}>
                                            {item.rejectReason}
                                        </div>
                                    )}
                                    {/* 대기중일 때만 취소 버튼 노출 */}
                                    {item.appStatus === 'PENDING' && (
                                        <button 
                                            onClick={() => onCancel(item.appId)}
                                            style={{ ...styles.cancelBtn, marginLeft: '0', display: 'inline-block' }}
                                        >
                                            취소
                                        </button>
                                    )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="8" style={styles.noData}>신청 내역이 없습니다.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


const styles = {
    container: {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    theadRow: { backgroundColor: '#fafafa', borderBottom: '1px solid #eee' },
    th: { textAlign: 'left', padding: '15px', color: '#666', fontWeight: '600', backgroundColor: '#f5f5f5', },
    td: { padding: '15px', borderBottom: '1px solid #f9f9f9', color: '#333' },
    tr: { transition: '0.2s' },
    badge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    cancelBtn: {
        padding: '5px 10px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: 'pointer',
        color: '#ff4d4f',
        margin: 0,              
        display: 'block',
        textAlign: 'left'
    },
    noData: { padding: '50px', textAlign: 'center', color: '#999' }
};

export default LeaveHistoryTable;