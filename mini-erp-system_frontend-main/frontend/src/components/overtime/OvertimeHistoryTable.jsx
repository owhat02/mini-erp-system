import React from 'react';
// 04.06 추가 
const OvertimeHistoryTable = ({ historyData = [], onCancel }) => {
  
  // 상태별 배지 색상 지정
  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return { color: '#2ecc71', backgroundColor: '#eefaf3' }; // 승인 (초록)
      case 'REJECTED': return { color: '#e74c3c', backgroundColor: '#fdf2f2' }; // 반려 (빨강)
      case 'CANCELLED': return { color: '#999', backgroundColor: '#f5f5f5' }; //취소 
      default: return { color: '#f1c40f', backgroundColor: '#fff9e6' };        // 대기
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED': return '승인';
      case 'REJECTED': return '반려';
      case 'CANCELLED': return '취소';
      default: return '대기중';
    }
  };

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>신청일</th>
            <th style={styles.th}>특근 날짜</th>
            <th style={styles.th}>시작 시간</th>
            <th style={styles.th}>종료 시간</th>
            <th style={styles.th}>특근 사유</th>
            <th style={styles.th}>상태</th>
            <th style={styles.th}>비고</th>
          </tr>
        </thead>
        <tbody>
          {historyData.length === 0 ? (
            <tr>
              <td colSpan="5" style={styles.noData}>특근 신청 내역이 없습니다.</td>
            </tr>
          ) : (
            historyData.map((item) => (
              <tr key={item.id} style={styles.tr}>
                <td style={styles.td}>{item.createdAt ? item.createdAt.split('T')[0] : '-'}</td>
                <td style={styles.td}>{item.overtimeDate}</td>
                <td style={styles.td}>{item.startTime.substring(0, 5)}</td>
                <td style={styles.td}>{item.endTime.substring(0, 5)}</td>
                <td style={{ ...styles.td, textAlign: 'left' }}>{item.reason}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...getStatusStyle(item.status) }}>
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td style={styles.td}>
                  {/* 대기중일 때만 취소 버튼 노출 */}
                    {item.status === 'PENDING' && (
                        <button 
                          onClick={() => onCancel(item.id)}
                          style={styles.cancelBtn}
                        >
                          취소
                        </button>
                    )}
                  </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
    // 1. 테이블 전체를 감싸는 하얀 박스
    container: {
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },
    table: { 
        width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    theadRow: { backgroundColor: '#fafafa', borderBottom: '1px solid #eee' },
    th: { textAlign: 'left', padding: '15px', color: '#666', fontWeight: '600', backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee'},
    td: { 
        padding: '15px', borderBottom: '1px solid #f9f9f9', color: '#333',textAlign: 'left' },
    tr: { transition: '0.2s',},
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
        color: '#ff4d4f'
    },
    noData: { 
        padding: '50px', 
        textAlign: 'center', 
        color: '#999' 
    }
};

export default OvertimeHistoryTable;