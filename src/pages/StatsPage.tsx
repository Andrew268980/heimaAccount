import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getMonthlyStats,
  getMonthlyTotal,
  getMonthlyIncomeTotal,
  getDailyStats,
} from '@/lib/db'
import { getCategoryIcon } from '@/lib/categories'

export default function StatsPage() {
  const today = new Date()
  const [yearMonth, setYearMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
  )

  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [pieData, setPieData] = useState<{ name: string; value: number; icon: string }[]>([])
  const [dailyData, setDailyData] = useState<{ date: string; expense: number; income: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [yearMonth])

  async function loadStats() {
    try {
      setLoading(true)
      setError(null)
      const [total, income, stats, daily] = await Promise.all([
        getMonthlyTotal(yearMonth),
        getMonthlyIncomeTotal(yearMonth),
        getMonthlyStats(yearMonth),
        getDailyStats(yearMonth),
      ])

      setMonthlyTotal(total)
      setMonthlyIncome(income)

      const pie = stats.map((s) => ({
        name: s.category_level1,
        value: s.total,
        icon: getCategoryIcon(s.category_level1),
      }))
      setPieData(pie)

      const daysInMonth = new Date(
        parseInt(yearMonth.slice(0, 4)),
        parseInt(yearMonth.slice(5, 7)),
        0,
      ).getDate()

      const dailyMap: Record<string, { expense: number; income: number }> = {}
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${yearMonth}-${String(d).padStart(2, '0')}`
        dailyMap[date] = { expense: 0, income: 0 }
      }
      for (const d of daily) {
        if (dailyMap[d.date]) {
          if (d.type === 'income') {
            dailyMap[d.date].income = d.total
          } else {
            dailyMap[d.date].expense = d.total
          }
        }
      }
      const dailyArr = Object.entries(dailyMap).map(([date, vals]) => ({
        date: date.slice(8),
        expense: vals.expense,
        income: vals.income,
      }))
      setDailyData(dailyArr)
    } catch (e) {
      console.error('Failed to load stats:', e)
      setError('加载统计数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  function prevMonth() {
    const [y, m] = yearMonth.split('-').map(Number)
    if (m === 1) {
      setYearMonth(`${y - 1}-12`)
    } else {
      setYearMonth(`${y}-${String(m - 1).padStart(2, '0')}`)
    }
  }

  function nextMonth() {
    const [y, m] = yearMonth.split('-').map(Number)
    if (m === 12) {
      setYearMonth(`${y + 1}-01`)
    } else {
      setYearMonth(`${y}-${String(m + 1).padStart(2, '0')}`)
    }
  }

  const balance = monthlyIncome - monthlyTotal

  const pieOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      type: 'scroll' as const,
      orient: 'vertical' as const,
      right: 10,
      top: 20,
      bottom: 20,
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: pieData.map((d) => ({
          name: `${d.icon} ${d.name}`,
          value: d.value,
        })),
      },
    ],
  }

  const lineOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    legend: {
      data: ['支出', '收入'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: dailyData.map((d) => d.date),
      axisLabel: {
        interval: Math.max(0, Math.floor(dailyData.length / 15) - 1),
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '支出',
        type: 'line',
        data: dailyData.map((d) => d.expense),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' },
            ],
          },
        },
      },
      {
        name: '收入',
        type: 'line',
        data: dailyData.map((d) => d.income),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ],
          },
        },
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold text-slate-700 min-w-28 text-center">
          {yearMonth.replace('-', '年')}月
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-red-500 mb-1">总支出</p>
              <p className="text-xl font-bold text-red-600">
                ¥{monthlyTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-500 mb-1">总收入</p>
              <p className="text-xl font-bold text-emerald-600">
                ¥{monthlyIncome.toFixed(2)}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 text-center ${
                balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">结余</p>
              <p
                className={`text-xl font-bold ${
                  balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                {balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* 饼图 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-base font-semibold text-slate-700 mb-2">
              支出分类占比
            </h3>
            {pieData.length > 0 ? (
              <ReactECharts option={pieOption} style={{ height: 320 }} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                本月暂无支出数据
              </div>
            )}
          </div>

          {/* 折线图 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-base font-semibold text-slate-700 mb-2">
              每日收支趋势
            </h3>
            {dailyData.length > 0 ? (
              <ReactECharts option={lineOption} style={{ height: 300 }} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                本月暂无数据
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
