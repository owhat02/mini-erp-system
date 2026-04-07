import axios from 'axios';

/**
 * 1. Axios 인스턴스 생성
 * baseURL에 /api/v1을 포함하여 모든 요청이 백엔드 API 경로를 기본으로 하도록 설정합니다.
 */
const instance = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // 백엔드 API 기본 경로
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * 2. 요청(Request) 인터셉터 설정
 * 로컬 스토리지에 저장된 토큰이 있다면 모든 요청 헤더에 자동으로 포함시킵니다.
 */
instance.interceptors.request.use(
  (config) => {
    // [중요] 로그인 시 저장한 키 이름이 'user_token'이 맞는지 꼭 확인하세요!
    // 만약 그냥 'token'으로 저장했다면 localStorage.getItem('token')으로 수정해야 합니다.
    const token = localStorage.getItem('user_token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 3. 응답(Response) 인터셉터 설정 (추가됨)
 * 서버로부터의 응답을 가로채서 401(권한 없음) 에러 발생 시 공통 처리를 수행합니다.
 */
instance.interceptors.response.use(
  (response) => {
    // 응답 데이터가 성공적이면 그대로 반환
    return response;
  },
  (error) => {
    // 서버에서 401 에러를 보냈을 경우 (토큰 만료 혹은 잘못된 토큰)
    if (error.response && error.response.status === 401) {
      console.error("인증 에러 발생: 토큰이 유효하지 않거나 만료되었습니다.");
      
      // 필요한 경우 로컬 스토리지의 만료된 토큰을 삭제
      localStorage.removeItem('user_token');
      
      // 로그인 페이지로 강제 이동 시키고 싶다면 아래 주석을 해제하세요.
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// 4. 설정된 인스턴스를 내보냅니다.
export default instance;