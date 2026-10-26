"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Trash2,
  Users,
  PlusCircle,
  Calendar,
  Repeat,
  Lock,
  LogOut,
  Pencil,
  UserPlus,
  X,
  Check,
  Filter,
} from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export default function AdminDashboard() {
  // Simple Password State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Create Slot State
  const [slots, setSlots] = useState<any[]>([]);
  const [title, setTitle] = useState("Small Group Training");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [genderRestriction, setGenderRestriction] = useState("mixed");
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [loading, setLoading] = useState(false);

  // Admin Filter State
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "today" | "week" | "past" | "all">("upcoming");
  const [specificDateFilter, setSpecificDateFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  // Edit Existing Slot State
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotTitle, setEditSlotTitle] = useState("");
  const [editSlotDate, setEditSlotDate] = useState("");
  const [editSlotStartTime, setEditSlotStartTime] = useState("");
  const [editSlotEndTime, setEditSlotEndTime] = useState("");
  const [editSlotCapacity, setEditSlotCapacity] = useState(1);
  const [editSlotGender, setEditSlotGender] = useState("mixed");

  // Manage Client Bookings State (Add / Edit)
  const [addingToSlotId, setAddingToSlotId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");

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

  function toLocalDateKey(isoString: string) {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

  function startEditingSlot(slot: any) {
    const startObj = new Date(slot.start_time);
    const endObj = new Date(slot.end_time);

    const formattedDate = toLocalDateKey(slot.start_time);
    const formattedStart = `${String(startObj.getHours()).padStart(2, "0")}:${String(
      startObj.getMinutes()
    ).padStart(2, "0")}`;
    const formattedEnd = `${String(endObj.getHours()).padStart(2, "0")}:${String(
      endObj.getMinutes()
    ).padStart(2, "0")}`;

    setEditingSlotId(slot.id);
    setEditSlotTitle(slot.title);
    setEditSlotDate(formattedDate);
    setEditSlotStartTime(formattedStart);
    setEditSlotEndTime(formattedEnd);
    setEditSlotCapacity(slot.max_capacity);
    setEditSlotGender(slot.gender_restriction || "mixed");
  }

  async function handleUpdateSlot(e: React.FormEvent, slotId: string) {
    e.preventDefault();
    const updatedStart = new Date(`${editSlotDate}T${editSlotStartTime}`).toISOString();
    const updatedEnd = new Date(`${editSlotDate}T${editSlotEndTime}`).toISOString();

    const { error } = await supabase
      .from("time_slots")
      .update({
        title: editSlotTitle,
        start_time: updatedStart,
        end_time: updatedEnd,
        max_capacity: Number(editSlotCapacity),
        gender_restriction: editSlotGender,
      })
      .eq("id", slotId);

    if (error) {
      alert("Error updating slot: " + error.message);
    } else {
      setEditingSlotId(null);
      fetchSlots();
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm("Delete this entire time slot and all its bookings?")) return;
    await supabase.from("time_slots").delete().eq("id", id);
    fetchSlots();
  }

  async function handleAddClientToSlot(e: React.FormEvent, slotId: string) {
    e.preventDefault();
    const { error } = await supabase.from("bookings").insert([
      {
        slot_id: slotId,
        client_name: newClientName,
        client_email: newClientEmail,
        client_phone: newClientPhone,
      },
    ]);

    if (error) {
      alert("Error adding client: " + error.message);
    } else {
      setAddingToSlotId(null);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      fetchSlots();
    }
  }

  function startEditingBooking(booking: any) {
    setEditingBookingId(booking.id);
    setEditClientName(booking.client_name);
    setEditClientEmail(booking.client_email);
    setEditClientPhone(booking.client_phone);
  }

  async function handleUpdateBooking(e: React.FormEvent, bookingId: string) {
    e.preventDefault();
    const { error } = await supabase
      .from("bookings")
      .update({
        client_name: editClientName,
        client_email: editClientEmail,
        client_phone: editClientPhone,
      })
      .eq("id", bookingId);

    if (error) {
      alert("Error updating booking: " + error.message);
    } else {
      setEditingBookingId(null);
      fetchSlots();
    }
  }

  async function handleDeleteBooking(bookingId: string, clientName: string) {
    if (!confirm(`Remove ${clientName} from this session?`)) return;
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) {
      alert("Error removing client: " + error.message);
    } else {
      fetchSlots();
    }
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

  // Safe client-side date tracking for filters
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const now = currentDate || new Date();
  const todayKey = toLocalDateKey(now.toISOString());
  const nextWeekDate = new Date(now);
  nextWeekDate.setDate(now.getDate() + 7);

  const filteredSlots = slots.filter((slot) => {
    const slotStart = new Date(slot.start_time);
    const slotDateKey = toLocalDateKey(slot.start_time);

    if (specificDateFilter) {
      if (slotDateKey !== specificDateFilter) return false;
    } else {
      if (timeFilter === "upcoming" && slotStart < now) return false;
      if (timeFilter === "today" && slotDateKey !== todayKey) return false;
      if (timeFilter === "week" && (slotStart < now || slotStart > nextWeekDate)) return false;
      if (timeFilter === "past" && slotStart >= now) return false;
    }

    if (genderFilter !== "all" && slot.gender_restriction !== genderFilter) {
      return false;
    }

    return true;
  });

  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

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

        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Slots & Client Bookings ({filteredSlots.length})
            </h2>
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "upcoming", label: "Upcoming" },
                { id: "today", label: "Today" },
                { id: "week", label: "Next 7 Days" },
                { id: "past", label: "Past" },
                { id: "all", label: "All" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTimeFilter(tab.id as any);
                    setSpecificDateFilter("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !specificDateFilter && timeFilter === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={specificDateFilter}
                  onChange={(e) => setSpecificDateFilter(e.target.value)}
                  className="border rounded-lg px-2.5 py-1 text-xs bg-white"
                />
                {specificDateFilter && (
                  <button
                    type="button"
                    onClick={() => setSpecificDateFilter("")}
                    title="Clear date filter"
                    className="text-xs text-red-600 hover:underline px-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="border rounded-lg px-2.5 py-1 text-xs bg-white"
              >
                <option value="all">All Genders</option>
                <option value="mixed">Mixed Only</option>
                <option value="female">Women Only</option>
                <option value="male">Men Only</option>
              </select>
            </div>
          </div>

          {filteredSlots.length === 0 && (
            <p className="text-slate-500 bg-white p-6 rounded-xl border text-center">
              No time slots match your current filter.
            </p>
          )}

          {filteredSlots.map((slot) => {
            const bookedCount = slot.bookings?.length || 0;
            const isFull = bookedCount >= slot.max_capacity;
            const isEditingThisSlot = editingSlotId === slot.id;

            return (
              <div key={slot.id} className="bg-white p-5 rounded-xl shadow-sm border space-y-4">
                {isEditingThisSlot ? (
                  <form
                    onSubmit={(e) => handleUpdateSlot(e, slot.id)}
                    className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-amber-800">
                        Editing Time Slot Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Title</label>
                        <input
                          type="text"
                          required
                          value={editSlotTitle}
                          onChange={(e) => setEditSlotTitle(e.target.value)}
                          className="w-full border rounded p-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Max Capacity</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={editSlotCapacity}
                          onChange={(e) => setEditSlotCapacity(Number(e.target.value))}
                          className="w-full border rounded p-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Gender Access</label>
                        <select
                          value={editSlotGender}
                          onChange={(e) => setEditSlotGender(e.target.value)}
                          className="w-full border rounded p-2 text-sm bg-white"
                        >
                          <option value="mixed">Mixed (Everyone)</option>
                          <option value="female">Women Only</option>
                          <option value="male">Men Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={editSlotDate}
                          onChange={(e) => setEditSlotDate(e.target.value)}
                          className="w-full border rounded p-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Start Time</label>
                        <input
                          type="time"
                          required
                          value={editSlotStartTime}
                          onChange={(e) => setEditSlotStartTime(e.target.value)}
                          className="w-full border rounded p-2 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">End Time</label>
                        <input
                          type="time"
                          required
                          value={editSlotEndTime}
                          onChange={(e) => setEditSlotEndTime(e.target.value)}
                          className="w-full border rounded p-2 text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Slot Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(null)}
                        className="text-xs text-slate-600 px-3 py-2 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap justify-between items-start gap-2">
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

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4" />
                        {bookedCount} / {slot.max_capacity} booked
                      </span>

                      {!isFull && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingToSlotId(addingToSlotId === slot.id ? null : slot.id);
                            setNewClientName("");
                            setNewClientEmail("");
                            setNewClientPhone("");
                          }}
                          className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add Client
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEditingSlot(slot)}
                        title="Edit time slot details"
                        className="text-slate-400 hover:text-blue-600 transition p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        title="Delete entire time slot"
                        className="text-slate-400 hover:text-red-600 transition p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {addingToSlotId === slot.id && (
                  <form
                    onSubmit={(e) => handleAddClientToSlot(e, slot.id)}
                    className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-lg space-y-3"
                  >
                    <p className="text-xs font-semibold text-blue-800 uppercase">
                      Manually Add Client to This Session:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Client Name"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="border rounded p-2 text-sm bg-white"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="border rounded p-2 text-sm bg-white"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="border rounded p-2 text-sm bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Save Client
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingToSlotId(null)}
                        className="text-xs text-slate-600 px-3 py-2 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {bookedCount > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Registered Clients:</p>
                    <ul className="space-y-2 text-sm">
                      {slot.bookings.map((b: any) => {
                        const isEditing = editingBookingId === b.id;

                        if (isEditing) {
                          return (
                            <li key={b.id} className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                              <form
                                onSubmit={(e) => handleUpdateBooking(e, b.id)}
                                className="flex flex-col md:flex-row gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  required
                                  value={editClientName}
                                  onChange={(e) => setEditClientName(e.target.value)}
                                  className="border rounded p-1.5 text-sm bg-white w-full"
                                  placeholder="Name"
                                />
                                <input
                                  type="tel"
                                  required
                                  value={editClientPhone}
                                  onChange={(e) => setEditClientPhone(e.target.value)}
                                  className="border rounded p-1.5 text-sm bg-white w-full"
                                  placeholder="Phone"
                                />
                                <input
                                  type="email"
                                  required
                                  value={editClientEmail}
                                  onChange={(e) => setEditClientEmail(e.target.value)}
                                  className="border rounded p-1.5 text-sm bg-white w-full"
                                  placeholder="Email"
                                />
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    type="submit"
                                    title="Save changes"
                                    className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBookingId(null)}
                                    title="Cancel"
                                    className="bg-slate-200 text-slate-700 p-1.5 rounded hover:bg-slate-300"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </form>
                            </li>
                          );
                        }

                        return (
                          <li
                            key={b.id}
                            className="flex flex-wrap justify-between items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-slate-900">{b.client_name}</span>
                              <span className="text-slate-500 ml-3 text-xs md:text-sm">
                                {b.client_phone} • {b.client_email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditingBooking(b)}
                                title="Edit client info"
                                className="text-slate-500 hover:text-blue-600 p-1 transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b.id, b.client_name)}
                                title="Remove client from slot"
                                className="text-slate-500 hover:text-red-600 p-1 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
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
