// src/db/models.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── User ─────────────────────────────────────────────────────────
const UserSchema = new Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  barangay:  { type: String, required: true },
  role:      { type: String, default: 'admin' },
}, { timestamps: true });

// ── Owner ─────────────────────────────────────────────────────────
const OwnerSchema = new Schema({
  name:     { type: String, required: true },
  address:  { type: String },
  contact:  { type: String },
  barangay: { type: String },
}, { timestamps: true });

// ── Animal ────────────────────────────────────────────────────────
const AnimalSchema = new Schema({
  name:         { type: String, required: true },
  breed:        { type: String },
  species:      { type: String, required: true },
  color:        { type: String },
  sex:          { type: String },
  age:          { type: String },
  owner:        { type: Schema.Types.ObjectId, ref: 'Owner' },
  owner_name:   { type: String, required: true },
  vax_status:   { type: String, default: 'Unvaccinated' },
  notes:        { type: String },
  image:        { type: String },   // base64 data URL
  registered_at:{ type: Date, default: Date.now },
}, { timestamps: true });

// ── Vaccination ───────────────────────────────────────────────────
const VaccinationSchema = new Schema({
  animal:    { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
  vaccine:   { type: String, required: true },
  given_by:  { type: String },
  given_at:  { type: Date, default: Date.now },
  next_due:  { type: Date },
  notes:     { type: String },
}, { timestamps: true });

// ── Lost & Found ──────────────────────────────────────────────────
const LostFoundSchema = new Schema({
  animal:      { type: Schema.Types.ObjectId, ref: 'Animal' },
  type:        { type: String, enum: ['lost', 'found'], required: true },
  description: { type: String },
  last_seen:   { type: String },
  reporter:    { type: String },
  contact:     { type: String },
  status:      { type: String, default: 'active' },
  reported_at: { type: Date, default: Date.now },
}, { timestamps: true });

// ── Adoption ──────────────────────────────────────────────────────
const AdoptionSchema = new Schema({
  animal:      { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
  animal_name: { type: String, required: true },
  species:     { type: String },
  description: { type: String },
  listed_by:   { type: String },
  status:      { type: String, default: 'available' },
  listed_at:   { type: Date, default: Date.now },
}, { timestamps: true });

// ── Scan Report ───────────────────────────────────────────────────
const ScanReportSchema = new Schema({
  animal:     { type: Schema.Types.ObjectId, ref: 'Animal' },
  scanned_by: { type: String, required: true },
  location:   { type: String },
  notes:      { type: String },
  scanned_at: { type: Date, default: Date.now },
}, { timestamps: true });

// ── Activity Log ──────────────────────────────────────────────────
const ActivitySchema = new Schema({
  color:     { type: String, default: 'blue' },
  text:      { type: String, required: true },
  actor:     { type: String },
  logged_at: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = {
  User:       mongoose.model('User',       UserSchema),
  Owner:      mongoose.model('Owner',      OwnerSchema),
  Animal:     mongoose.model('Animal',     AnimalSchema),
  Vaccination:mongoose.model('Vaccination',VaccinationSchema),
  LostFound:  mongoose.model('LostFound',  LostFoundSchema),
  Adoption:   mongoose.model('Adoption',   AdoptionSchema),
  ScanReport: mongoose.model('ScanReport', ScanReportSchema),
  Activity:   mongoose.model('Activity',   ActivitySchema),
};
