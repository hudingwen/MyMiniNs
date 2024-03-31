import request from '@/utils/request.js'


//获取血糖实例
export const GetCurBloodSugar = params => {
    return request.get('/api/Nightscout/GetCurBloodSugar', { params: params });
};
//获取血糖实例
export const BindQR = params => {
  return request.get('/api/Nightscout/BindQR', { params: params });
};

//更新小程序使用探头时间 
export const UpdateMyProbeStartTime = params => {
  return request.get('/api/Nightscout/UpdateMyProbeStartTime', { params: params });
};

