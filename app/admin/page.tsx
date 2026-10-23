"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Users, PlusCircle, Calendar, Repeat, Lock, LogOut } from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export default function AdminDashboard() {
  // Simple Password State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Dashboard State
  const [slots, setSlots] = useState<any[]>([]);
  const [title, setTitle] = useState("Small Group Training");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [genderRestriction, setGenderRestriction] = useState("mixed");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem("trainer_admin_unlocked");
    if (savedAuth === "true") {
      setIsUnlocked(true);
      fetchSlots();
    }
    setCheckingAuth(false);
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      localStorage.setItem("trainer_admin_unlocked", "true");
      setIsUnlocked(true);
      setAuthError("");
      fetchSlots();
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  }

  function handleLock() {
    localStorage.removeItem("trainer_admin_unlocked");
    setIsUnlocked(false);
    setPasswordInput("");
  }

  async function fetchSlots() {
    const { data } = await supabase
      .from("time_slots")
      .select("*, bookings(*)")
      .order("start_time", { ascending: true });
    if (data) setSlots(data);
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const baseStart = new Date(`${date}T${startTime}`);
    const baseEnd = new Date(`${date}T${endTime}`);

    const slotsToInsert = [];
    for (let i = 0; i < repeatWeeks; i++) {
      const slotStart = new Date(baseStart);
      slotStart.setDate(slotStart.getDate() + i * 7);

      const slotEnd = new Date(baseEnd);
      slotEnd.setDate(slotEnd.getDate() + i * 7);

      slotsToInsert.push({
        title,
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        max_capacity: Number(maxCapacity),
        gender_restriction: genderRestriction,
      });
    }

    const { error } = await supabase.from("time_slots").insert(slotsToInsert);

    setLoading(false);
    if (error) {
      alert("Error creating slot(s): " + error.message);
    } else {
      fetchSlots();
    }
  }

  async function handleDeleteSlot(id: string) {
    await supabase.from("time_slots").delete().eq("id", id);
    fetchSlots();
  }

  function getGenderBadge(gender: string) {
    if (gender === "female") {
      return <span className="text-xs font-semibold bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full">Women Only</span>;
    }
    if (gender === "male") {
      return <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">Men Only</span>;
    }
    return <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">Mixed</span>;
  }

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  // Simple 1-Password Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
        <form onSubmit={handleUnlock} className="bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Trainer Access</h1>
            <p className="text-sm text-slate-500">Enter the admin password to manage sessions.</p>
          </div>

          {authError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg text-center">
              {authError}
            </p>
          )}

          <div>
            <input
              type="password"
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border rounded-lg p-3 text-center text-lg tracking-widest"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  // Unlocked Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Trainer Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-blue-600 hover:underline">
              View Client Booking Page →
            </a>
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 bg-white border px-3 py-1.5 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Lock
            </button>
          </div>
        </div>

        {/* Create Custom Slot Form */}
        <form onSubmit={handleCreateSlot} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Add Custom Time Slot(s)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Session Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="e.g., HIIT Group or Women's Strength"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Capacity (Spots)</label>
              <input
                type="number"
                min={1}
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">First Session Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Session Gender Access</label>
              <select
                value={genderRestriction}
                onChange={(e) => setGenderRestriction(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white"
              >
                <option value="mixed">Mixed (Everyone)</option>
                <option value="female">Women Only</option>
                <option value="male">Men Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Repeat className="w-4 h-4 text-slate-500" />
                Weekly Schedule Repeat
              </label>
              <select
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                className="w-full border rounded-lg p-2 bg-white"
              >
                <option value={1}>Does not repeat (Just this date)</option>
                <option value={4}>Repeat weekly for 4 weeks</option>
                <option value={8}>Repeat weekly for 8 weeks</option>
                <option value={12}>Repeat weekly for 12 weeks</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {loading
              ? "Saving..."
              : repeatWeeks > 1
              ? `Create ${repeatWeeks} Weekly Slots`
              : "Create Time Slot"}
          </button>
        </form>

        {/* List of Created Slots & Bookings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Time Slots & Client Bookings
          </h2>

          {slots.length === 0 && (
            <p className="text-slate-500 bg-white p-6 rounded-xl border">
              No custom slots created yet. Use the form above to add your first session!
            </p>
          )}

          {slots.map((slot) => {
            const bookedCount = slot.bookings?.length || 0;
            return (
              <div key={slot.id} className="bg-white p-5 rounded-xl shadow-sm border space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{slot.title}</h3>
                      {getGenderBadge(slot.gender_restriction)}
                    </div>
                    <p className="text-sm text-slate-600">
                      {new Date(slot.start_time).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      •{" "}
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4" />
                      {bookedCount} / {slot.max_capacity} booked
                    </span>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {bookedCount > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Registered Clients:</p>
                    <ul className="space-y-1 text-sm">
                      {slot.bookings.map((b: any) => (
                        <li key={b.id} className="flex justify-between bg-slate-50 p-2 rounded">
                          <span className="font-medium">{b.client_name}</span>
                          <span className="text-slate-600">{b.client_phone} • {b.client_email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}