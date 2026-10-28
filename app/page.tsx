"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Users, CheckCircle2, UserCheck, Filter } from "lucide-react";

export default function ClientBookingPage() {
  const [clientGender, setClientGender] = useState<"female" | "male" | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("all"); // "all" or "YYYY-MM-DD"
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  // Helper to get local YYYY-MM-DD string from a timestamp
  function toLocalDateKey(isoString: string) {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

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
      setSelectedDate("all");
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
      alert("Désolé, cette session vient de se remplir !");
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
      alert("Erreur de réservation : " + error.message);
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
      return <span className="text-xs font-semibold bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">Femmes uniquement</span>;
    }
    if (gender === "male") {
      return <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">Hommes uniquement</span>;
    }
    return <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">Session mixte</span>;
  }

  // Extract unique available dates for the horizontal Day Picker
  const availableDates = Array.from(
    new Set(slots.map((s) => toLocalDateKey(s.start_time)))
  );

  // Filter slots by the selected day
  const filteredSlots =
    selectedDate === "all"
      ? slots
      : slots.filter((s) => toLocalDateKey(s.start_time) === selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Réservez votre session d'entraînement</h1>
          <p className="text-slate-600">Sélectionnez votre profil ci-dessous pour voir les sessions disponibles adaptées pour vous.</p>
        </div>

        {/* Step 1: Mandatory Gender Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Étape 1 : Indiquez votre genre pour afficher les créneaux disponibles
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
              Femme (Créneaux mixtes et réservés aux femmes)
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
              Homme (Créneaux mixtes et réservés aux hommes)
            </button>
          </div>
        </div>

        {bookedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Réservation confirmée !</p>
              <p className="text-sm">Votre place a bien été réservée. À bientôt pour l'entraînement !</p>
            </div>
          </div>
        )}

        {/* Step 2: Date Filter & Available Slots */}
        {clientGender && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-lg font-semibold">Étape 2 : Choisissez un jour et un créneau horaire</h2>
              {selectedDate !== "all" && (
                <button
                  onClick={() => setSelectedDate("all")}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Afficher toutes les dates ({slots.length})
                </button>
              )}
            </div>

            {/* Horizontal Day Filter Strip */}
            {availableDates.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("all");
                    setSelectedSlot(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold shrink-0 transition ${
                    selectedDate === "all"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Toutes les dates ({slots.length})
                </button>

                {availableDates.map((dateStr) => {
                  const [y, m, d] = dateStr.split("-").map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const isActive = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlot(null);
                      }}
                      className={`px-4 py-2 rounded-xl border text-center shrink-0 transition ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs uppercase opacity-80 font-medium">
                        {dateObj.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </div>
                      <div className="text-sm font-bold">
                        {dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredSlots.length === 0 ? (
              <p className="text-slate-500 bg-white p-6 rounded-xl border text-center">
                Aucune session à venir n'est disponible pour cette sélection.
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredSlots.map((slot) => {
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
                              {new Date(slot.start_time).toLocaleDateString("fr-FR", {
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
                              COMPLET
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {spotsLeft} {spotsLeft === 1 ? "place restante" : "places restantes"}
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
                            Entrez vos coordonnées pour réserver votre place :
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              required
                              autoFocus
                              placeholder="Votre nom complet"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="border rounded-lg p-2.5 w-full text-sm"
                            />
                            <input
                              type="email"
                              required
                              placeholder="Adresse e-mail"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="border rounded-lg p-2.5 w-full text-sm"
                            />
                            <input
                              type="tel"
                              required
                              placeholder="Numéro de téléphone"
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
                              {submitting ? "Confirmation..." : "Confirmer la réservation"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSlot(null)}
                              className="text-slate-600 px-3 py-2 text-sm hover:underline"
                            >
                              Annuler
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
