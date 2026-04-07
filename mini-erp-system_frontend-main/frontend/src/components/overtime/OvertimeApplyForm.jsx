import React, { useState } from 'react';
import api from '../../api/axios';
// 04.06 추가 

const OvertimeApplyForm = ({ user }) => {
    const [formData, setFormData] = useState({
        overtimeDate: '',
        startTime: '19:00',
        endTime: '21:00',
        reason: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 프론트엔드 방어 코드: 주말 체크 (0: 일요일, 6: 토요일)
        const selectedDate = new Date(formData.overtimeDate);
        const day = selectedDate.getDay();
        if (day !== 0 && day !== 6) {
            alert("❌ 특근은 주말(토, 일)에만 신청 가능합니다.");
            return;
        }

        // 백엔드 형식에 맞게 시간 뒤에 :00 초 추가
        const apiData = {
            startDate: formData.overtimeDate, 
            endDate: formData.overtimeDate,
            startTime: `${formData.startTime}:00`,
            endTime: `${formData.endTime}:00`,
            reason: formData.reason || '긴급 대응'
        };

        try {
            const response = await api.post('/overtime', apiData);
            if (response.data.success) {
                alert("✅ 특근 신청이 완료되었습니다!");
                setFormData({ overtimeDate: '', startTime: '19:00', endTime: '21:00', reason: '' });
            }
        } catch (err) {
            const msg = err.response?.data?.message || "입력값을 확인해주세요.";
            alert(`❌ 신청 실패: ${msg}`);
        }
    };

    return (
        <div style={styles.card}>
            <h3 style={styles.title}>📝 특근 신청서 </h3>
            <form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>특근 날짜 *</label>
                    <input type="date" name="overtimeDate" value={formData.overtimeDate} onChange={handleChange} style={styles.input} required />
                </div>

                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>시작 시간 *</label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} style={styles.input} required />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>종료 시간 *</label>
                        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} style={styles.input} required />
                    </div>
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>특근 사유</label>
                    <textarea name="reason" value={formData.reason} onChange={handleChange} style={styles.textarea} placeholder="특근 사유를 입력하세요" />
                </div>

                <button type="submit" style={styles.button}>특근 신청하기</button>
            </form>
        </div>
    );
};

const styles = {
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    title: { fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' },
    inputGroup: { marginBottom: '15px' },
    row: { display: 'flex', gap: '15px', marginBottom: '15px' },
    label: { display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', resize: 'none', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', backgroundColor: '#7C3AED', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }
};

export default OvertimeApplyForm;