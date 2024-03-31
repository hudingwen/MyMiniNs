<script setup>
import { onMounted, ref, watch, onUnmounted, toRefs, toRef } from 'vue'
import { useRoute } from 'vue-router';
import * as echarts from "echarts";
import { GetCurBloodSugar, BindQR, UpdateMyProbeStartTime } from '@/api/nightscout.js'

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
//血糖步伐
const bloodHour = ref("24");
const curBlood = ref({ date_step: 0 })
const curDate = ref('')
const curTime = ref('')
const allDays = ref([])

const days = ref([])
const day0 = ref([])
const day1 = ref([])
const day2 = ref([])
const xListAll = ref([])
const xList = ref([])
const openid = ref('')
const ticket = ref('')
const minutes = ref(0)
const seconds = ref(0)
const isRequest = ref(false)
const showChartType = ref('line')
const countDow = ref(Date.now() + 60 * 1000)

//定义方法
const handleHour = (val) => {
  bloodHour.value = val
  show()
}
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


const test = () => {
  console.info("test", countDow.value)
}

const getCurBlood = () => {

  GetCurBloodSugar({ openid: openid.value }).then(res => {
    if (res.data.success) {
      curBlood.value = res.data.response.curBlood
      allDays.value = res.data.response.groupDays
      if (curBlood.value.date_day)
        curDate.value = curBlood.value.date_day

      countDow.value = curBlood.value.nextRefreshTime


      // x轴
      xList.value = res.data.response.day0.map(t => t.showLabel);
      xListAll.value = res.data.response.day0.map(t => t.showLabel);
      day0.value = JSON.parse(JSON.stringify(res.data.response.day0));
      days.value = JSON.parse(JSON.stringify(res.data.response.day0));
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

const handleOneDay = (day) => {
  curDate.value = day
  day0.value = []
  if (day) {
    for (let index = 0; index < days.value.length; index++) {
      let element = days.value[index];
      if (element.date_day === day)
        day0.value.push(element)
    }
  } else {
    day0.value = days.value
  }

  xList.value = day0.value.map(t => t.showLabel);
  show()
}
const initMapChart = () => {
  myChart = echart.init(document.getElementById("myEcharts"));
  window.addEventListener("resize", () => {
    myChart.resize();
  });
}
//处理传感器设置时间
const showProbe = ref(false)
const handleProbe = () => {
  showProbe.value = true
}
const submitProbe = () => {
  ElMessageBox.confirm('确定提交么?')
    .then(() => {
      handleSubmitTime()
    })
    .catch((err) => {
      console.info(err)
    })
}
//传感器时间
const probeForm = ref({
  time: ''
})

//更新传感器时间
const handleSubmitTime = () => {
  UpdateMyProbeStartTime({ openid: openid.value, time: probeForm.value.time }).then(res => {
    if (res.data.success) {
      showProbe.value = false
      ElMessage.success(res.data.msg)
      getCurBlood()
    } else {
      ElMessage.error(res.data.msg)
    }
    // setWork();
  })
}

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



  let zoomStartIndex = 0;

  let flagCount = 8;
  let count = 0;
  let index = -1;

  if (bloodHour.value === '1') {
    flagCount = 1
    showChartType.value = 'scatter'
  } else if (bloodHour.value === '3') {
    flagCount = 2
    showChartType.value = 'scatter'
  } else if (bloodHour.value === '6') {
    flagCount = 3
    showChartType.value = 'scatter'
  } else if (bloodHour.value === '12') {
    flagCount = 4
    showChartType.value = 'line'
  } else if (bloodHour.value === '24') {
    flagCount = 8
    showChartType.value = 'line'
  }
  if (flagCount != 0) {
    for (let i = day0.value.length - 1; i >= 0; i--) {
      if (day0.value[i] && day0.value[i].showLabel) {
        count++;
        if (flagCount === count) {
          index = i;
          zoomStartIndex = index;
          break;
        }
      }
    }
  } else {
    zoomStartIndex = 0
  }
  //偏移
  if (bloodHour.value === '2') {
    zoomStartIndex += 4
  } else if (bloodHour.value === '3') {
    zoomStartIndex += 3
  } if (bloodHour.value === '4') {
    zoomStartIndex += 2
  }


  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      // trigger: 'mouse',
      position: [45, 30],
      formatter: (params, index) => {
        let data = day0.value[params[0].dataIndex]
        if (data) {
          return data.date_str + "<br/>血糖: " + data.sgv_str + " mmol/L"
        } else {
          return "";
        }
      },
      // formatter: function (params) {
      //   console.log(params)
      //   return params;
      // }
    },
    // legend: {
    //   selected: selectLegend.value,
    //   data: ['今天', '昨天', '前天']
    // },
    grid: {
      left: '45px',
      right: '20px',
      top: '20px',
      bottom: '30%',
      // containLabel: true
    },
    // toolbox: {
    //   feature: {

    //   }
    // },
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
    xAxis:
    {
      type: 'category',
      data: xList.value,
      // splitNumber: 6,
      axisLabel: {
        rotate: 45, //字体斜放着
        interval: (index, value) => {
          if (xList.value[index]) {
            return true
          } else {
            return false
          }
        },
        formatter: '{value}',
        formatter: (value, index) => {
          // 如果数据值为空，则不显示标签
          if (value) {
            return value;
          }
          // 否则，显示正常的标签
          return '';
        }
      },
    },
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
      max: 18,
      // max 是最大的值
      splitNumber: 4,
    },
    series: [
      // {
      //   symbolSize: 3,
      //   data: day0.value.map(t => t.sgv_str),
      //   name: '血糖',
      //   type: 'scatter'
      // },
      {
        symbolSize: 3,
        name: '血糖',
        data: day0.value.map(t => t.sgv_str),
        // type: 'line',
        type: showChartType.value,
        // smooth: true,
        // symbol: "none",
        // xAxisIndex: 0,
        // connectNulls: true,
        // color: lineGreen
      },
      {
        type: 'line',
        markLine: {
          symbol: "none", //标线箭头取消
          data: [
            {
              yAxis: 3.9,
              name: "低",
              lineStyle: { color: "blue" },
              label: {
                formatter: "低",
                padding: [0, 0, 10, 0],
                position: 'end'
              },
            },
            {
              yAxis: 10,
              name: "高",
              lineStyle: { color: "red" },
              label: {
                formatter: "高",
                padding: [0, 0, 10, 0],
                position: 'end'
              },
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
    ],

    dataZoom: [
      {
        show: true,
        type: 'slider',
        handleSize: 0, // 两边的按钮大小
        startValue: zoomStartIndex, // 从倒数第10个数据开始
        endValue: day0.value.length, // 到最后一个数据结束
        // startValue: 1,  // 重点在这   -- 开始的值
        // endValue: 8,   // 重点在这   -- 结束的值
        labelFormatter: (index, value) => {
          if (index >= 0)
            return day0.value[index].date_str
        }
      },
      {
        zoomLock: true, // 这个开启之后只能通过鼠标左右拉动，不能滚动显示
        type: 'inside',
      }
    ],
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
              <el-dropdown-item @click="handleProbe">2.记录传感器启用时间</el-dropdown-item>
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
                <el-countdown format="s" :value="countDow" @finish="getCurBlood" />
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
      <el-divider content-position="left">
        <strong>血糖趋势</strong>
      </el-divider>




      <div style="text-align: center;">

        <el-radio-group v-model="bloodHour" size="small" @change="handleHour">
          <el-radio-button label="1" value="1" />
          <el-radio-button label="3" value="3" />
          <el-radio-button label="6" value="6" />
          <el-radio-button label="12" value="12" />
          <el-radio-button label="24" value="24" />
          <el-radio-button label="小时" value="" disabled />
        </el-radio-group>
      </div>
      <div style="height: 300px;width: 100%" class="map" ref="mapChart" id="myEcharts"></div>

      <!-- 日期筛选 -->
      <div style="font-size: 12px;color: silver;height: 21px;text-align: center;">
        <el-select clearable @change="handleOneDay" v-model="curDate" placeholder="请选择所选日期" size="small"
          style="width: 240px;text-align: center;">
          <el-option v-for="(item, index) in allDays" :key="index" :label="item" :value="item" />
        </el-select>
      </div>
    </el-col>
    <el-col>
      <el-divider content-position="left"><strong>信息</strong></el-divider>

      <div v-if="curBlood.probeStartTime" style="font-size: 12px;color: silver;height: 21px;text-align: center;">
        传感器启用时间: <label> <strong>{{ curBlood.probeStartTime }}</strong></label>
        已使用:
        <label> <strong style="color: red;">{{ curBlood.probeUseDays }}</strong>
          天</label>
        <label> <strong style="color: red;">{{ curBlood.probeUseHours
            }}</strong>小时</label>
        <label> <strong style="color: red;">{{ curBlood.probeUseMinutes
            }}</strong>分钟</label>
      </div>
    </el-col>

    <el-col>
      <p style="margin: 0 15px;text-align: center;font-size: 12px;">{{ curBlood.saying }}</p>
      <el-divider content-position="right"><strong>{{ curBlood.title }}</strong></el-divider>
    </el-col>
  </el-row>




  <!-- 传感器时间 -->
  <el-dialog v-model="showProbe" title="记录传感器时间" width="450px" :before-close="handleClose">
    <el-form @submit.prevent ref="refForm" :model="probeForm" label-width="80px" status-icon label-position="top">
      <el-form-item prop="time" label="请选择传感器启用时间" width sortable>
        <el-date-picker value-format="YYYY-MM-DD HH:mm:ss" v-model="probeForm.time" type="datetime"
          placeholder="请选择传感器启用时间" />
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