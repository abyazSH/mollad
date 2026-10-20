'use client';
import { useState } from 'react';
import { Text } from '@/components/language-provider';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatRupiah } from '@/lib/money';
import { categoryColorStyle } from '@/lib/category-colors';
type Point = { label: string; income: number; expense: number };
type Category = { name: string; color: string; value: number };
export function FinanceCharts({
  daily,
  monthly,
  categories,
  expense,
}: {
  daily: Point[];
  monthly: Point[];
  categories: Category[];
  expense: number;
}) {
  const [period, setPeriod] = useState('daily');
  return (
    <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
      <section className="card accent-card min-w-0 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold">
              <Text>{'Arus keuangan'}</Text>
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              <Text>
                {period === 'daily'
                  ? 'Pemasukan dan pengeluaran pada bulan laporan.'
                  : 'Pemasukan dan pengeluaran selama enam bulan hingga bulan laporan.'}
              </Text>
            </p>
          </div>
          <div className="flex rounded-lg bg-canvas p-1 text-[10px] font-bold">
            <button
              className={
                'min-h-11 rounded-md px-3 py-1.5 text-xs ' +
                (period === 'daily'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted')
              }
              onClick={() => setPeriod('daily')}
              aria-pressed={period === 'daily'}
            >
              <Text>{'Harian'}</Text>
            </button>
            <button
              className={
                'min-h-11 rounded-md px-3 py-1.5 text-xs ' +
                (period === 'monthly'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted')
              }
              onClick={() => setPeriod('monthly')}
              aria-pressed={period === 'monthly'}
            >
              <Text>{'Bulanan'}</Text>
            </button>
          </div>
        </div>
        <div className="mb-5 mt-6 flex gap-5 text-[10px] text-muted">
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[var(--chart-income)]" />
            <Text>{'Pemasukan'}</Text>
          </span>
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[var(--chart-expense)]" />
            <Text>{'Pengeluaran'}</Text>
          </span>
        </div>
        <div
          className="h-56 w-full"
          role="img"
          aria-label="Grafik tren pemasukan dan pengeluaran"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={period === 'daily' ? daily : monthly}
              margin={{ left: -12, right: 5, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0"
                    stopColor="var(--chart-income)"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="1"
                    stopColor="var(--chart-income)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--line)"
                vertical={false}
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                minTickGap={18}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted)', fontSize: 10 }}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? v / 1000000 + 'jt'
                    : v >= 1000
                      ? v / 1000 + 'rb'
                      : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  fontSize: 11,
                  color: 'var(--ink)',
                }}
                labelStyle={{ color: 'var(--ink)' }}
                itemStyle={{ color: 'var(--ink)' }}
                formatter={(value: number) => formatRupiah(value)}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="income"
                name="Pemasukan"
                stroke="var(--chart-income)"
                strokeWidth={3}
                fill="url(#incomeFill)"
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="expense"
                name="Pengeluaran"
                stroke="var(--chart-expense)"
                strokeDasharray="5 3"
                strokeWidth={3}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-[10px] text-muted">
          <summary className="cursor-pointer">
            <Text>{'Lihat angka grafik'}</Text>
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>
                    <Text>{'Periode'}</Text>
                  </th>
                  <th>
                    <Text>{'Pemasukan'}</Text>
                  </th>
                  <th>
                    <Text>{'Pengeluaran'}</Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(period === 'daily' ? daily : monthly).map((p) => (
                  <tr key={p.label}>
                    <td>{p.label}</td>
                    <td>{formatRupiah(p.income)}</td>
                    <td>{formatRupiah(p.expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="card min-w-0 p-6">
        <h2 className="text-sm font-extrabold">
          <Text>{'Pengeluaran per kategori'}</Text>
        </h2>
        <p className="mt-1 text-[11px] text-muted">
          <Text>{'Pengeluaran menurut kategori.'}</Text>
        </p>
        {!categories.length ? (
          <div className="empty">
            <p>
              <Text>{'Belum ada pengeluaran pada bulan laporan.'}</Text>
            </p>
          </div>
        ) : (
          <>
            <div className="relative mx-auto h-[190px] max-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={categories}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={83}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categories.map((c) => (
                      <Cell
                        key={c.name}
                        className="category-color"
                        style={categoryColorStyle(c.color)}
                        fill="var(--category-display)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{
                      background: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: 12,
                      fontSize: 11,
                      color: 'var(--ink)',
                    }}
                    labelStyle={{ color: 'var(--ink)' }}
                    itemStyle={{ color: 'var(--ink)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[9px] text-muted">
                  <Text>{'TOTAL PENGELUARAN'}</Text>
                </p>
                <p className="mt-1 text-[12px] font-extrabold tabular-nums">
                  {formatRupiah(expense)}
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span
                    className="category-color h-2 w-2 rounded-full"
                    style={categoryColorStyle(c.color)}
                  />
                  <span className="flex-1 text-muted">{c.name}</span>
                  <span className="font-bold tabular-nums">
                    {formatRupiah(c.value)}
                  </span>
                  <span className="w-8 text-right text-muted">
                    {Math.round((c.value / expense) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
