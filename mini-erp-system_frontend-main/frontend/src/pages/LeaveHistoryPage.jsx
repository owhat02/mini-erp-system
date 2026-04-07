import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import LeaveHistoryTable from '../components/leave/LeaveHistoryTable';
import LeaveStatusCards from '../components/leave/LeaveStatusCards';
import OvertimeHistoryTable from '../components/overtime/OvertimeHistoryTable';
// 04.06 수정 

// [수정] 부모로부터 onNavigateToApply 함수를 받습니다.
const LeaveHistoryPage = ({ onNavigateToApply }) => {
  const { user } = useAuthStore();
  const [leaveData, setLeaveData] = useState([]);
  const [overtimeData, setOvertimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 권한 확인 변수
  const userRole = user?.role || '';

  
  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const leaveRes = await api.get(`/leave/my`);
      if (leaveRes.data.success) {
      setLeaveData(leaveRes.data.data || []);
      } 

      // [특근 로직 수정] 권한에 따른 분기 처리
      const isStaff = userRole === 'USER';
      const overtimeEndpoint = isStaff ? `/overtime/my` : `/overtime/all`;

      const overtimeRes = await api.get(overtimeEndpoint);

      if (overtimeRes.data.success) {
        const rawOvData = overtimeRes.data.data || [];

        if (isStaff) {
          // 사원은 가져온 데이터 그대로 사용
          setOvertimeData(rawOvData);
        } else {
          // 팀장/관리자는 전체 목록 중 본인 ID와 일치하는 것만 필터링
          const myOvertimes = rawOvData.filter(item => 
            String(item.requesterId) === String(user?.id)
          );
          setOvertimeData(myOvertimes);
        }
      }

    } catch (error) {
      console.error("내역 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, userRole]);

    // 연차 취소 처리 함수
  const handleCancelLeave = async (appId) => {
    if (!window.confirm("신청하신 연차를 취소하시겠습니까?")) return;
    try {
      const res = await api.patch(`/leave/${appId}/cancel`);
      if (res.data.success) {
        alert("연차 신청이 취소되었습니다.");
        fetchHistory(); // 대시보드 및 목록 갱신
      }
    } catch (error) {
      alert(error.response?.data?.message || "연차 취소 중 오류가 발생했습니다.");
    }
  };

  // 특근 취소 처리 함수
  const handleCancelOvertime = async (id) => {
    if (!window.confirm("신청하신 특근을 취소하시겠습니까?")) return;
    try {
      const res = await api.patch(`/overtime/${id}/cancel`);
      if (res.data.success) {
        alert("특근 신청이 취소되었습니다.");
        fetchHistory(); // 대시보드 및 목록 갱신
      }
    } catch (error) {
      alert(error.response?.data?.message || "특근 취소 중 오류가 발생했습니다.");
    }
  };


  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ textAlign: 'left' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>📋 연차/특근 신청 내역</h1>
        <p style={{ color: '#666', marginTop: '10px' }}>나의 신청 현황을 확인하세요</p>
      </div>

      <LeaveStatusCards leaveData={leaveData} overtimeData={overtimeData} />

      <div style={styles.listContainer}>
        <div style={styles.listHeader}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>연차 신청 목록</h3>
        </div>
        <LeaveHistoryTable historyData={leaveData} onCancel={handleCancelLeave} />
      </div>

      <div style={styles.listContainer}>
        <div style={styles.listHeader}>
          <h3 style={{ margin: 0, fontSize: '18px'}}>특근 신청 목록</h3>
        </div>
        <OvertimeHistoryTable historyData={overtimeData} onCancel={handleCancelOvertime} />
      </div>

    </div>
  );
};

const styles = {
  listContainer: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
};

export default LeaveHistoryPage;