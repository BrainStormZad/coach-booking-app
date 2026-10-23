"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Users, CheckCircle2, UserCheck } from "lucide-react";

export default function ClientBookingPage() {
  const [clientGender, setClientGender] = useState<"female" | "male" | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  async function fetchSlots(gender: "female" | "male") {
    const { data } = await supabase
      .from("time_slots")
      .select("*, bookings(id)")
      .in("gender_restriction", ["mixed", gender])
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });
    if (data) setSlots(data);
  }

  useEffect(() => {
    if (clientGender) {
      setSelectedSlot(null);
      fetchSlots(clientGender);
    }
  }, [clientGender]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !clientGender) return;
    setSubmitting(true);

    const { data: currentBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("slot_id", selectedSlot.id);

    if ((currentBookings?.length || 0) >= selectedSlot.max_capacity) {
      alert("Sorry, this session just filled up!");
      setSubmitting(false);
      fetchSlots(clientGender);
      return;
    }

    const { error } = await supabase.from("bookings").insert([
      {
        slot_id: selectedSlot.id,
        client_name: name,
        client_email: email,
        client_phone: phone,
      },
    ]);

    setSubmitting(false);
    if (error) {
      alert("Booking error: " + error.message);
    } else {
      setBookedSuccess(true);
      setSelectedSlot(null);
      setName("");
      setEmail("");
      setPhone("");
      fetchSlots(clientGender);
    }
  }

  function getGenderBadge(gender: string) {
    if (gender === "female") {
      return <span className="text-xs font-semibold bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">Women Only</span>;
    }
    if (gender === "male") {
      return <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">Men Only</span>;
    }
    return <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">Mixed Session</span>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Book Your Training Session</h1>
          <p className="text-slate-600">Select your profile below to view available sessions tailored to you.</p>
        </div>

        {/* Step 1: Mandatory Gender Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Step 1: Specify Your Gender to View Available Slots
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setClientGender("female")}
              className={`py-4 px-6 rounded-xl font-semibold border text-center transition ${
                clientGender === "female"
                  ? "bg-pink-50 border-pink-600 text-pink-800 ring-2 ring-pink-600"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              Woman (Mixed & Women-Only Slots)
            </button>
            <button
              type="button"
              onClick={() => setClientGender("male")}
              className={`py-4 px-6 rounded-xl font-semibold border text-center transition ${
                clientGender === "male"
                  ? "bg-indigo-50 border-indigo-600 text-indigo-800 ring-2 ring-indigo-600"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              Man (Mixed & Men-Only Slots)
            </button>
          </div>
        </div>

        {bookedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Booking Confirmed!</p>
              <p className="text-sm">Your spot has been reserved. See you at training!</p>
            </div>
          </div>
        )}

        {/* Step 2: Show Filtered Slots & Inline Booking Form */}
        {clientGender && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 2: Choose a Time Slot</h2>

            {slots.length === 0 ? (
              <p className="text-slate-500 bg-white p-6 rounded-xl border text-center">
                No upcoming sessions available for this category right now.
              </p>
            ) : (
              <div className="grid gap-4">
                {slots.map((slot) => {
                  const bookedCount = slot.bookings?.length || 0;
                  const spotsLeft = slot.max_capacity - bookedCount;
                  const isFull = spotsLeft <= 0;
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl border transition overflow-hidden ${
                        isFull
                          ? "bg-slate-100 opacity-60"
                          : isSelected
                          ? "bg-white border-blue-600 ring-2 ring-blue-600 shadow-md"
                          : "bg-white hover:border-blue-400"
                      }`}
                    >
                      {/* Clickable Slot Header */}
                      <div
                        onClick={() => {
                          if (!isFull) {
                            setBookedSuccess(false);
                            setSelectedSlot(isSelected ? null : slot);
                          }
                        }}
                        className={`p-5 flex justify-between items-center ${
                          isFull ? "cursor-not-allowed" : "cursor-pointer"
                        } ${isSelected ? "bg-blue-50/60" : ""}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{slot.title}</h3>
                            {getGenderBadge(slot.gender_restriction)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(slot.start_time).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                              {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isFull ? (
                            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full">
                              FULL
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inline Booking Form Directly Under Selected Slot */}
                      {isSelected && (
                        <form
                          onSubmit={handleBook}
                          className="p-5 bg-white border-t border-blue-100 space-y-4"
                        >
                          <h4 className="text-sm font-semibold text-slate-700">
                            Enter your details to reserve your spot:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              required
                              autoFocus
                              placeholder="Your Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="border rounded-lg p-2.5 w-full text-sm"
                            />
                            <input
                              type="email"
                              required
                              placeholder="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="border rounded-lg p-2.5 w-full text-sm"
                            />
                            <input
                              type="tel"
                              required
                              placeholder="Phone Number"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="border rounded-lg p-2.5 w-full text-sm"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                              {submitting ? "Confirming..." : "Confirm Booking"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot(null)}
                              className="text-slate-600 px-3 py-2 text-sm hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}