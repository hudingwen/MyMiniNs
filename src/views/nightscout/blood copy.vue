<script setup>
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router';
import * as echarts from "echarts";
import { GetCurBloodSugar, BindQR } from '@/api/nightscout.js'

import { ArrowDown } from '@element-plus/icons-vue'

import { ElMessage, ElMessageBox } from 'element-plus'
/// 声明定义一下echart
let echart = echarts;

onMounted(() => {

  // 获取查询参数
  const route = useRoute();
  openid.value = route.query.openid
  ticket.value = route.query.ticket
  // 初始化dom
  initMapChart();

  if (ticket.value) {
    //绑定


  } else {
    //查看
    getData();
  }
});

onUnmounted(() => {

});


//定义变量 

// echart实例不能进行深度探测
let myChart = null;
const curBlood = ref({ date_step: 0 })
const curDate = ref('')
const curTime = ref('')
const day0 = ref([])
const day1 = ref([])
const day2 = ref([])
const xList = ref([])
const selectLegend = ref({
  "今天": true,
  "前天": false,
  "昨天": false
})
const spList = ref([
  '00:00:00',
  '03:00:00',
  '06:00:00',
  '09:00:00',
  '12:00:00',
  '15:00:00',
  '18:00:00',
  '21:00:00',
  '23:59:59'
])
const openid = ref('')
const ticket = ref('')
const minutes = ref(0)
const seconds = ref(0)
const isRequest = ref(false)

const countDow = ref(Date.now() + 10000)

//定义方法
const setWork = () => {
  setInterval(() => {
    if (seconds.value <= 0 && isRequest.value === false) {
      isRequest.value = true
      getCurBlood();
    }
    let tempSecond = seconds.value - 1
    if (tempSecond < 0) {
      seconds.value = 0
    } else {
      seconds.value = tempSecond
    }
    let tempDiff = Math.ceil(1.0 * seconds.value / 60)
    if (tempDiff !== minutes.value)
      curBlood.value.date_step += 1
    minutes.value = tempDiff
  }, 1000);
}

const getData = () => {

  if (ticket.value) {
    //绑定
    BindQR({ openid: openid.value, ticket: ticket.value }).then(res => {
      if (res.data.success) {
        ElMessage.success(res.data.msg)
      } else {
        ElMessage.error(res.data.msg)
      }
      // setWork();
    })

  } else {
    //查看
    // setWork();
  }
}



const getCurBlood = () => {

  GetCurBloodSugar({ openid: openid.value }).then(res => {
    if (res.data.success) {
      curBlood.value = res.data.response.curBlood
      if (curBlood.value.date_day)
        curDate.value = curBlood.value.date_day


      // x轴
      xList.value = res.data.response.day0.map(t => t.date_str);

      day0.value = res.data.response.day0;

      show()
      if (curBlood.value !== null && curBlood.value.date_step !== null) {
        let tempDiff = 5 - curBlood.value.date_step
        if (tempDiff === 0)
          minutes.value = 1;
        else if (tempDiff > 0) {
          if (tempDiff > 5) tempDiff = 5;
          minutes.value = tempDiff;
          seconds.value = tempDiff * 60
        } else {
          minutes.value = 1;
          seconds.value = 1 * 60
        }
      } else {
        minutes.value = 1;
        seconds.value = 1 * 60
      }
    } else {
      minutes.value = 1;
      seconds.value = 1 * 60
      ElMessage.error(res.data.msg)
    }

  }).catch(err => {
    minutes.value = 1;
    seconds.value = 1 * 60
    console.info("err", err)
    ElMessage.error(err)
  }).finally(() => {
    isRequest.value = false
  })
}
const initMapChart = () => {
  myChart = echart.init(document.getElementById("myEcharts"));
  window.addEventListener("resize", () => {
    myChart.resize();
  });
}
//处理探头设置时间
const showProbe = ref(false)
const handleProbe = () => {
  showProbe.value = true
}
const submitProbe = () => {
  ElMessageBox.confirm('确定提交么?')
    .then(() => {

    })
    .catch((err) => {
      console.info(err)
    })
}
//探头时间
const probeForm = ref({})
//窗口关闭
const handleClose = (done) => {
  ElMessageBox.confirm('确定关闭么?')
    .then(() => {
      done()
    })
    .catch((err) => {
      console.info(err)
    })
}
const show = () => {
  const lineRed = '#E74C3C'
  const lineGreen = '#2ECC71'
  const lineBlue = '#3498DB'
  const linePurple = '#9B59B6'

  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      // trigger: 'mouse',
      position: [40, 40],
      formatter: (params,index) => { 
        let data = day0.value[index]
        if (data) {
          return data.date_str + "<br/>血糖: " + data.sgv_str + " mmol/L"
        } else {
          return "";
        }
      },
      axisPointer: {
        animation: false
      }
    },
    // legend: {
    //   selected: selectLegend.value,
    //   data: ['今天', '昨天', '前天']
    // },
    grid: {
      left: '25px',
      right: '20px',
      top: '20px',
      // bottom: '3%',
      // containLabel: true
    },
    toolbox: {
      feature: {

      }
    },
    visualMap: [
      {
        show: false,
        type: 'piecewise', // 分段型 visualMap
        pieces: [
          { min: 10, max: 100, color: lineRed },
          { min: 3.9, max: 10, color: lineGreen },
          { min: 0, max: 3.9, color: lineRed },
        ],
        seriesIndex: 0
      },
      {
        show: false,
        type: 'piecewise', // 分段型 visualMap
        pieces: [
          { min: 10, max: 100, color: lineRed },
          { min: 3.9, max: 10, color: lineBlue },
          { min: 0, max: 3.9, color: lineRed },
        ],
        seriesIndex: 1
      },
      {
        show: false,
        type: 'piecewise', // 分段型 visualMap
        pieces: [
          { min: 10, max: 100, color: lineRed },
          { min: 3.9, max: 10, color: linePurple },
          { min: 0, max: 3.9, color: lineRed },
        ],
        seriesIndex: 2
      }
    ],
    dataZoom: [
      {
        show: true,
        type: 'slider',
        handleSize: 0, // 两边的按钮大小
        // startValue: 1,  // 重点在这   -- 开始的值
        // endValue: 8,   // 重点在这   -- 结束的值
      },
      {
        zoomLock: true, // 这个开启之后只能通过鼠标左右拉动，不能滚动显示
        type: 'inside',
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: xList.value,
        axisLabel: {
          formatter: '{value}',
          splitNumber: 8,
          // nameGap: 50,
          interval(index, value) {
            // 根据某几个数据划分间隔宽度
            console.info("value", value, "index", index)

            return false
          },
          formatter(params, index) {
            // 判断索引是否为2或4，如果是则显示标签
            console.info("params", params, "index", index)
           
            return params;
          }

        },
        boundaryGap: false,//x轴与z轴线对应
        axisLine: { onZero: false },
        axisTick: {
          show: false,
          alignWithLabel: true
        },
        splitLine: {    //网格线
          lineStyle: {
            type: 'dashed'    //设置网格线类型 dotted：虚线   solid:实线
          },
          show: true //隐藏或显示
        }
      }
    ],
    // xAxis: {
    //     type: 'value',
    //     data: xList.value,
    //     // min: 0,
    //     // max: 100,
    //     splitNumber: 5 // 尝试将数值轴分为5个区间，即有6个刻度线，包含两端
    // }, 
    yAxis: {
      type: 'value',
      splitLine: { //网格线
        lineStyle: {
          type: 'dashed' //设置网格线类型 dotted：虚线 solid:实线
        },
        show: true //隐藏或显示
      },
      min: 0,
      // min 是最小的值
      max: 15,
      // max 是最大的值
      splitNumber: 3,
    },
    series: [
      {
        symbolSize: 3,
        data: day0.value.map(t => t.sgv_str), 
        name: '血糖',
        type: 'scatter',
        // 在系列中也可以使用 label 属性的 formatter 来定制标签内容
        label: {
          show: true,
          formatter: (params) => {
            // 同样地，只展示对象中的 value 属性
            console.info("params", params)
            return params.data.sgv_str;
          }
        }
      },
      // {
      //   name: '今天',
      //   data: day0.value.map(t => t.sgv_str),
      //   type: 'line',
      //   smooth: true,
      //   symbol: "none",
      //   xAxisIndex: 0,
      //   connectNulls: true,
      //   color: lineGreen
      // },
      // {
      //   name: '昨天',
      //   data: day1.value.map(t => t.sgv_str),
      //   type: 'line',
      //   smooth: true,
      //   symbol: "none",
      //   xAxisIndex: 0,
      //   connectNulls: true,
      //   color: lineBlue
      // },
      // {
      //   name: '前天',
      //   data: day2.value.map(t => t.sgv_str),
      //   type: 'line',
      //   smooth: true,
      //   symbol: "none",
      //   xAxisIndex: 0,
      //   connectNulls: true,
      //   color: linePurple
      // },
      {
        type: 'line',
        markLine: {
          symbol: "none", //标线箭头取消
          data: [
            {
              yAxis: 3.9,
              name: "低",
              lineStyle: { color: "blue" },
              label: { formatter: "低(3.9)" },
            },
            {
              yAxis: 10,
              name: "高",
              lineStyle: { color: "red" },
              label: { formatter: "高(10)" },
            },
          ],
          label: {
            position: "insideEndTop",
            color: "red",
            fontSize: 10,
            fontFamily: "SourceHanSansCN-Regular",
          },
          lineStyle: {
            type: "solid",
            width: 1,
          },
        }
      },
      // {
      //   name: '高低线',
      //   type: 'line',
      //   data: [],
      //   smooth: true,

      // },


    ],
    // 添加标线
    graphic: [
      {
        type: 'line',
        left: 'xAxis',
        top: 'yAxis',
        shape: {
          x1: '10%', y1: '80%',
          x2: '90%', y2: '80%'
        },
        style: {
          stroke: 'red',
          lineDash: [4, 4] // 虚线样式
        }
      },
      {
        type: 'line',
        left: 'xAxis',
        top: 'yAxis',
        shape: {
          x1: '10%', y1: '120%',
          x2: '90%', y2: '120%'
        },
        style: {
          stroke: 'green',
          lineDash: [4, 4] // 虚线样式
        }
      }
    ]
  };

  myChart.setOption(option);

}










</script>
<template>

  <el-row
    style="padding: 10px;box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);border-radius: 5px;">
    <el-col>
      <el-divider content-position="left"><strong>实时血糖</strong>
        <el-dropdown style="margin-left: 10px" size="small" type="primary" trigger="click">

          <el-button type="primary" plain size="small" :icon="ArrowDown" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="getCurBlood">1.刷新实时血糖</el-dropdown-item>
              <el-dropdown-item @click="handleProbe">2.设置探头时间</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-divider>
    </el-col>
    <el-col style="padding: 8px 5px;">
      <div
        style="height: 100%; box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);border-radius: 5px;">
        <el-row :gutter="5" style="padding-top: 10px;padding-bottom: 10px">
          <!-- 时间 -->
          <el-col :span="8">
            <el-row style="text-align: center;">

              <el-col style=" min-height: 40px;font-size: 12px;color: silver;">
                <el-statistic :value="curBlood.date_step" />
                分前更新
              </el-col>
              <el-col>
                <label style="font-size: 12px;color: silver;height: 21px;"> {{ curBlood.date_time }}</label>
              </el-col>
            </el-row>
          </el-col>
          <!-- 血糖 -->
          <el-col :span="8">
            <el-row style="text-align: center;">
              <el-col>
                <label
                  :style="{ 'color': (curBlood.sgv_str >= 10 || curBlood.sgv_str <= 3.9 ? 'red' : 'green'), 'font-weight': 900, 'font-size': '31px', 'margin-top': '10px' }">{{
            curBlood.sgv_str }}</label>
              </el-col>
              <el-col>
                <label style="font-size: 12px;">mmol/L</label>
              </el-col>
            </el-row>
          </el-col>
          <!-- 趋势 -->
          <el-col :span="8">
            <el-row style="text-align: center;">

              <el-col style="font-size: 12px;color: silver;">
                <el-countdown format="ss" :value="countDow" @finish="getCurBlood" />
                秒后刷新
              </el-col>
              <el-col>
                <label style="font-size: 12px;font-weight: 1000;">{{ curBlood.direction_str }}</label>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col>
      <el-divider content-position="left"><strong>血糖趋势</strong></el-divider>
      <div style="height: 300px;width: 100%" class="map" ref="mapChart" id="myEcharts"></div>
    </el-col>
    <el-col>
      <el-divider content-position="left"><strong>信息</strong></el-divider>

      <div style="font-size: 12px;color: silver;height: 21px;text-align: center;">
        探头启用时间: <label> 2024-03-28 19:00</label> 已使用:<label> 20天</label>
      </div>
    </el-col>

    <el-col>
      <el-divider content-position="left">{{ curDate }} 今日达标率: {{ curBlood.percent }} %</el-divider>
      <p style="margin: 0 15px;text-align: center;font-size: 12px;">{{ curBlood.saying }}</p>
      <el-divider content-position="right"><strong>{{ curBlood.title }}</strong></el-divider>
    </el-col>
  </el-row>




  <!-- 弹窗 -->
  <el-dialog v-model="showProbe" title="设置探头时间" width="450px" :before-close="handleClose">
    <el-form @submit.prevent ref="refForm" :model="probeForm" :rules="ruleForm" label-width="80px" status-icon
      label-position="top">
      <el-form-item prop="startTime" label="请选择探头启用时间" width sortable>
        <el-date-picker v-model="probeForm.startTime" type="datetime" placeholder="请选择探头启用时间" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showProbe = false">取消</el-button>
        <el-button type="primary" @click="submitProbe">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style lang="scss" scoped></style>