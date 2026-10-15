import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Flame, Plus, Trash2, Calendar, 
  TrendingUp, Activity, Sparkles, Utensils, Award, Settings,
  ChevronRight, Dumbbell, Apple, BookOpen, Droplets, Moon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

const INITIAL_HABITS = [
  { id: '1', title: 'Силовая тренировка', category: 'Спорт', streak: 4, bestStreak: 12, completedDates: ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'], color: '#6366f1' },
  { id: '2', title: 'Выпить 2.5л воды', category: 'Здоровье', streak: 7, bestStreak: 15, completedDates: ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'], color: '#38bdf8' },
  { id: '3', title: 'Чтение книги 30 мин', category: 'Развитие', streak: 2, bestStreak: 8, completedDates: ['2026-10-14', '2026-10-15'], color: '#f59e0b' },
  { id: '4', title: 'Сон до 23:30', category: 'Режим', streak: 0, bestStreak: 5, completedDates: ['2026-10-13', '2026-10-14'], color: '#ec4899' },
];

const INITIAL_NUTRITION_GOALS = {
  calories: 2200,
  protein: 150,
  fat: 70,
  carbs: 240,
};

const DEFAULT_MEALS = [
  { id: 'm1', name: 'Завтрак', time: '08:30', protein: 35, fat: 20, carbs: 60, calories: 560 },
  { id: 'm2', name: 'Обед', time: '13:30', protein: 48, fat: 22, carbs: 75, calories: 690 },
  { id: 'm3', name: 'Полдник / Перекус', time: '17:00', protein: 25, fat: 8, carbs: 35, calories: 312 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('habits'); // 'habits' | 'bju' | 'analytics'
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Хранилище привычек
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('hf_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  // Хранилище КБЖУ
  const [bjuGoals, setBjuGoals] = useState(() => {
    const saved = localStorage.getItem('hf_bju_goals');
    return saved ? JSON.parse(saved) : INITIAL_NUTRITION_GOALS;
  });

  const [meals, setMeals] = useState(() => {
    const saved = localStorage.getItem('hf_meals');
    return saved ? JSON.parse(saved) : DEFAULT_MEALS;
  });

  // Состояния модалок
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCat, setNewHabitCat] = useState('Здоровье');

  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [mealForm, setMealForm] = useState({ name: '', protein: '', fat: '', carbs: '' });

  // Автосохранение
  useEffect(() => {
    localStorage.setItem('hf_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('hf_bju_goals', JSON.stringify(bjuGoals));
  }, [bjuGoals]);

  useEffect(() => {
    localStorage.setItem('hf_meals', JSON.stringify(meals));
  }, [meals]);

  // Управление привычками
  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const isDone = h.completedDates.includes(todayStr);
      const newDates = isDone
        ? h.completedDates.filter(d => d !== todayStr)
        : [...h.completedDates, todayStr];
      const newStreak = isDone ? Math.max(0, h.streak - 1) : h.streak + 1;
      return {
        ...h,
        completedDates: newDates,
        streak: newStreak,
        bestStreak: Math.max(h.bestStreak, newStreak)
      };
    }));
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newH = {
      id: Date.now().toString(),
      title: newHabitTitle,
      category: newHabitCat,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
      color: '#6366f1'
    };
    setHabits([...habits, newH]);
    setNewHabitTitle('');
    setIsAddHabitOpen(false);
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  // Расчет КБЖУ
  const currentNutrition = useMemo(() => {
    return meals.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [meals]);

  const addMeal = (e) => {
    e.preventDefault();
    const p = parseFloat(mealForm.protein) || 0;
    const f = parseFloat(mealForm.fat) || 0;
    const c = parseFloat(mealForm.carbs) || 0;
    const calories = Math.round((p * 4) + (f * 9) + (c * 4));

    const newM = {
      id: Date.now().toString(),
      name: mealForm.name || 'Прием пищи',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      protein: p,
      fat: f,
      carbs: c,
      calories
    };

    setMeals([...meals, newM]);
    setMealForm({ name: '', protein: '', fat: '', carbs: '' });
    setIsAddMealOpen(false);
  };

  const deleteMeal = (id) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  // График активности за последние 7 дней
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const count = habits.filter(h => h.completedDates.includes(str)).length;
      const rate = habits.length > 0 ? Math.round((count / habits.length) * 100) : 0;
      days.push({
        day: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        rate
      });
    }
    return days;
  }, [habits]);

  const completedTodayCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="flex justify-center bg-slate-950 text-slate-100 min-h-screen">
      {/* Контейнер в размерах iPhone с поддержкой Safe Area */}
      <div className="w-full max-w-md bg-slate-900 min-h-screen flex flex-col relative pb-28 pt-10 px-5 shadow-2xl border-x border-slate-800 selection:bg-indigo-500/30">
        
        {/* Заголовок */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Личный трекер</span>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              HabitFlow <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-xs font-bold text-orange-400">
              {Math.max(...habits.map(h => h.streak), 0)} дн. подряд
            </span>
          </div>
        </header>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
          
          {/* ВКЛАДКА 1: ПРИВЫЧКИ */}
          {activeTab === 'habits' && (
            <>
              {/* Прогресс-карточка дня */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-indigo-100">Цели на сегодня</h3>
                    <p className="text-2xl font-extrabold">{completedTodayCount} из {habits.length}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{habitCompletionRate}%</span>
                    <p className="text-xs text-indigo-200">выполнено</p>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-indigo-950/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500" 
                    style={{ width: `${habitCompletionRate}%` }}
                  />
                </div>
              </div>

              {/* Список привычек */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Привычки</h2>
                  <button 
                    onClick={() => setIsAddHabitOpen(true)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                </div>

                {habits.map((habit) => {
                  const isDone = habit.completedDates.includes(todayStr);
                  return (
                    <div 
                      key={habit.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isDone 
                          ? 'bg-indigo-950/20 border-indigo-500/40' 
                          : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                        <button className="text-slate-500 hover:text-indigo-400 transition">
                          {isDone ? (
                            <CheckCircle2 className="w-7 h-7 text-indigo-500 fill-indigo-500/20" />
                          ) : (
                            <Circle className="w-7 h-7 text-slate-600" />
                          )}
                        </button>
                        <div>
                          <p className={`font-semibold text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {habit.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 rounded-md bg-slate-800">
                              {habit.category}
                            </span>
                            <span className="text-[11px] text-orange-400/90 font-medium flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-orange-400/80" /> {habit.streak}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteHabit(habit.id)}
                        className="text-slate-600 hover:text-rose-400 p-2 transition active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ВКЛАДКА 2: ТРЕКЕР КБЖУ */}
          {activeTab === 'bju' && (
            <>
              {/* Сводная панель калорий */}
              <div className="p-5 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-md">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-sm font-semibold text-slate-400">Калории за день</h3>
                  <span className="text-xs text-slate-400">Цель: {bjuGoals.calories} ккал</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-white">{currentNutrition.calories}</span>
                  <span className="text-sm text-slate-400 font-medium">/ ост. {Math.max(0, bjuGoals.calories - currentNutrition.calories)} ккал</span>
                </div>

                {/* Прогресс-бары БЖУ */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/80">
                  {/* Белки */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-rose-400">Белки</span>
                      <span className="text-slate-400">{currentNutrition.protein}/{bjuGoals.protein}г</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (currentNutrition.protein / bjuGoals.protein) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Жиры */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-amber-400">Жиры</span>
                      <span className="text-slate-400">{currentNutrition.fat}/{bjuGoals.fat}г</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (currentNutrition.fat / bjuGoals.fat) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {/* Углеводы */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-sky-400">Углеводы</span>
                      <span className="text-slate-400">{currentNutrition.carbs}/{bjuGoals.carbs}г</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (currentNutrition.carbs / bjuGoals.carbs) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Список приемов пищи */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Приемы пищи</h2>
                  <button 
                    onClick={() => setIsAddMealOpen(true)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" /> Записать прием
                  </button>
                </div>

                {meals.map((meal) => (
                  <div key={meal.id} className="p-3.5 bg-slate-800/60 border border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-200">{meal.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{meal.time}</span>
                      </div>
                      <div className="flex gap-2.5 mt-1 text-[11px] text-slate-400 font-medium">
                        <span className="text-rose-400/90">Б: {meal.protein}г</span>
                        <span className="text-amber-400/90">Ж: {meal.fat}г</span>
                        <span className="text-sky-400/90">У: {meal.carbs}г</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-100">{meal.calories} <span className="text-[10px] font-normal text-slate-400">ккал</span></span>
                      <button onClick={() => deleteMeal(meal.id)} className="text-slate-600 hover:text-rose-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ВКЛАДКА 3: АНАЛИТИКА НЕДЕЛИ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-800/60 border border-slate-800 rounded-3xl">
                <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Выполнение за 7 дней
                </h3>
                <p className="text-xs text-slate-400 mb-4">Процент закрытых целей по дням недели</p>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val) => [`${val}%`, 'Закрыто']}
                      />
                      <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Лучшие серии */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Рекорды серий</h3>
                {habits.map(h => (
                  <div key={h.id} className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-300">{h.title}</span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Рекорд: {h.bestStreak} дн.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* НИЖНИЙ ТАБ-БАР (iOS Style) */}
        <nav className="absolute bottom-4 left-5 right-5 h-16 bg-slate-850/95 backdrop-blur-md rounded-2xl border border-slate-800/80 flex justify-around items-center px-2 z-20 shadow-xl">
          <button 
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'habits' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Привычки</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('bju')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'bju' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-[10px] font-semibold">КБЖУ</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Аналитика</span>
          </button>
        </nav>

        {/* МОДАЛКА: НОВАЯ ПРИВЫЧКА */}
        {isAddHabitOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Новая привычка</h3>
              <form onSubmit={addHabit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Название</label>
                  <input 
                    type="text" 
                    placeholder="Например: Пробежка 5 км"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Категория</label>
                  <select 
                    value={newHabitCat}
                    onChange={(e) => setNewHabitCat(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="Спорт">Спорт</option>
                    <option value="Здоровье">Здоровье</option>
                    <option value="Развитие">Развитие</option>
                    <option value="Режим">Режим</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddHabitOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 rounded-xl text-sm font-semibold text-slate-300 active:scale-95 transition"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white active:scale-95 transition"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* МОДАЛКА: ДОБАВИТЬ ПРИЕМ ПИЩИ */}
        {isAddMealOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Запись приема пищи</h3>
              <form onSubmit={addMeal} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Что съели</label>
                  <input 
                    type="text" 
                    placeholder="Например: Омлет с тостом"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-rose-400 font-medium">Белки (г)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-400 font-medium">Жиры (г)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={mealForm.fat}
                      onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-sky-400 font-medium">Углеводы (г)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={mealForm.carbs}
                      onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddMealOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 rounded-xl text-sm font-semibold text-slate-300"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
