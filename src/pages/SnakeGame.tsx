import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CELL = 20
const COLS = 30
const ROWS = 20
const TOTAL_CELLS = COLS * ROWS
const INITIAL_SPEED = 150

type Point = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'idle' | 'running' | 'over'

const DIR: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'UP', w: 'UP', W: 'UP',
  ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
  ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
  ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
}

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((s) => s.y * COLS + s.x))

  // Random sampling for up to 100 attempts
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * COLS)
    const y = Math.floor(Math.random() * ROWS)
    if (!occupied.has(y * COLS + x)) return { x, y }
  }

  // Fallback: sequential scan of all cells
  for (let idx = 0; idx < TOTAL_CELLS; idx++) {
    const x = idx % COLS
    const y = Math.floor(idx / COLS)
    if (!occupied.has(y * COLS + x)) return { x, y }
  }

  // Board completely full (only reachable after 599 food eaten)
  return { x: 0, y: 0 }
}

const INITIAL_SNAKE: Point[] = [
  { x: 14, y: 10 },
  { x: 13, y: 10 },
  { x: 12, y: 10 },
]

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Point[]>([...INITIAL_SNAKE])
  const foodRef = useRef<Point>(randomFood(INITIAL_SNAKE))
  const dirRef = useRef<Direction>('RIGHT')
  const nextDirRef = useRef<Direction>('RIGHT')
  const speedRef = useRef(INITIAL_SPEED)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreRef = useRef(0)

  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('snake-high-score') || '0') } catch { return 0 }
  })

  // Refs to keep the game loop from going stale — tick reads these, not the state values
  const gameStateRef = useRef<GameState>('idle')
  const highScoreRef = useRef(highScore)

  // Sync refs with state whenever state changes
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const snake = snakeRef.current
    const food = foodRef.current

    // Clear
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

    // Grid lines
    ctx.strokeStyle = '#f1f5f9'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke()
    }

    // Food
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2)
    ctx.fill()

    // Snake
    snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#059669' : '#10b981'
      ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2)
      if (i === 0) {
        ctx.fillStyle = '#fff'
        const cx = p.x * CELL + CELL / 2, cy = p.y * CELL + CELL / 2
        ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx + 3, cy - 3, 3, 0, Math.PI * 2); ctx.fill()
      }
    })
  }, [])

  function endGame() {
    gameStateRef.current = 'over'
    setGameState('over')
    const final = scoreRef.current
    // Use highScoreRef to avoid stale closure on state
    if (final > highScoreRef.current) {
      highScoreRef.current = final
      setHighScore(final)
      try { localStorage.setItem('snake-high-score', String(final)) } catch { /* noop */ }
    }
  }

  const tick = useCallback(() => {
    // Guard: don't execute if the game was stopped/paused
    if (gameStateRef.current !== 'running') return

    const snake = snakeRef.current
    const food = foodRef.current

    // Apply pending direction
    dirRef.current = nextDirRef.current

    const head = snake[0]
    const dir = DIR[dirRef.current]
    const newHead: Point = { x: head.x + dir.x, y: head.y + dir.y }

    // Wall collision → die
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      return endGame()
    }

    // Self collision → die (exclude tail when not eating, since it will be removed)
    const ate = newHead.x === food.x && newHead.y === food.y
    const bodyToCheck = ate ? snake : snake.slice(0, -1)
    if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      return endGame()
    }

    const newSnake = [newHead, ...snake]
    if (!ate) newSnake.pop()

    snakeRef.current = newSnake
    scoreRef.current = newSnake.length - INITIAL_SNAKE.length
    setScore(scoreRef.current)

    if (ate) {
      foodRef.current = randomFood(newSnake)
      if (scoreRef.current % 5 === 0 && speedRef.current > 60) {
        speedRef.current -= 10
      }
    }

    draw()
    timerRef.current = setTimeout(tick, speedRef.current)
  }, [draw])

  function startGame() {
    // Clear any pending timer to prevent double game loops
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    snakeRef.current = [...INITIAL_SNAKE]
    foodRef.current = randomFood(INITIAL_SNAKE)
    dirRef.current = 'RIGHT'
    nextDirRef.current = 'RIGHT'
    speedRef.current = INITIAL_SPEED
    scoreRef.current = 0
    setScore(0)
    gameStateRef.current = 'running'
    setGameState('running')
    draw()
    timerRef.current = setTimeout(tick, speedRef.current)
  }

  function stopGame() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    gameStateRef.current = 'idle'
    setGameState('idle')
    draw()
  }

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const next = KEY_MAP[e.key]
      if (!next) return
      e.preventDefault()

      // Can't reverse: compare against actual current direction, not pending
      const current = dirRef.current
      if (
        (current === 'UP' && next === 'DOWN') ||
        (current === 'DOWN' && next === 'UP') ||
        (current === 'LEFT' && next === 'RIGHT') ||
        (current === 'RIGHT' && next === 'LEFT')
      ) return

      nextDirRef.current = next

      if (gameStateRef.current === 'idle') startGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // Stable effect — reads gameStateRef.current, not state

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Initial draw
  useEffect(() => { draw() }, [draw])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">🐍 贪吃蛇</h2>
          <p className="text-sm text-slate-500 mt-1">方向键或 WASD 控制方向</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">{highScore}</span>
          </div>
          <div className="text-sm text-slate-500">
            得分: <span className="font-bold text-slate-700">{score}</span>
          </div>
          {gameState === 'running' ? (
            <Button variant="outline" size="sm" onClick={stopGame}>
              暂停
            </Button>
          ) : (
            <Button size="sm" onClick={startGame}>
              <Play className="h-4 w-4 mr-1" />
              {gameState === 'over' ? '再来一局' : '开始'}
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className="rounded-xl border-2 border-slate-200 shadow-sm"
          />
          {/* Overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
              <div className="text-center">
                <p className="text-5xl mb-3">🐍</p>
                <p className="text-slate-400 text-sm">按方向键或点击开始</p>
              </div>
            </div>
          )}
          {gameState === 'over' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
              <div className="text-center">
                <p className="text-3xl mb-2">💀</p>
                <p className="text-lg font-bold text-slate-700 mb-1">游戏结束</p>
                <p className="text-sm text-slate-500 mb-3">最终得分: {score}</p>
                <Button size="sm" onClick={startGame}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  再来一局
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
