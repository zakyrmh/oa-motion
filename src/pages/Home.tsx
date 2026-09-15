import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Database, HeartHandshake, ShieldAlert, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Header } from '@/components/common/Header';
import { useMedicalProfile } from '@/hooks/useMedicalProfile';
import { TARGET_KNEE_OPTIONS } from '@/constants/clinical';
import type { AssistanceStatus, CapabilityLevel } from '@/types/clinical';

const capabilityOptions: Array<{ id: CapabilityLevel; title: string; description: string }> = [
  { id: 'hanya_duduk', title: 'HANYA DUDUK', description: 'Latihan awal dengan fokus kontrol posisi duduk.' },
  { id: 'duduk_dan_berdiri', title: 'DUDUK & BERDIRI', description: 'Progresi sit-to-stand lalu squat bertahap.' },
];

const assistanceOptions: Array<{ id: AssistanceStatus; title: string; description: string }> = [
  { id: 'mandiri', title: 'MANDIRI', description: 'Saya berlatih sendiri dengan panduan digital.' },
  { id: 'butuh_pendamping', title: 'BUTUH PENDAMPING', description: 'Saya berlatih bersama keluarga atau pendamping.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useMedicalProfile();

  return (
    <AppLayout className="pb-32">
      <Header title="PROFIL LATIHAN HARIAN" stepText="LANGKAH 1 DARI 3: PENGATURAN PROFIL" onBack={() => navigate('/')} />
      <main className="flex flex-1 flex-col gap-6 p-4">
        <section aria-labelledby="disclaimer-heading">
          <Card className="flex flex-col gap-4 rounded-3xl border-2 border-black bg-white p-5 shadow-none sm:p-6">
            <Badge className="w-fit gap-1.5 rounded-full border-none bg-[#fff100] px-3 py-1 font-mono text-xs font-bold text-black shadow-none">
              <ShieldAlert className="size-4" /> DISCLAIMER MEDIS // PENTING
            </Badge>
            <div className="flex flex-col gap-2 text-black">
              <h2 id="disclaimer-heading" className="text-base font-bold uppercase tracking-tight sm:text-lg">PANDUAN KEAMANAN & BATASAN PENGGUNAAN</h2>
              <p className="text-sm font-medium leading-relaxed text-[#444444]">OA-Motion adalah alat bantu latihan, bukan alat diagnostik atau pengganti fisioterapis. Hentikan latihan bila muncul nyeri tajam, pusing, atau rasa tidak nyaman.</p>
              <p className="text-sm font-bold leading-relaxed text-black">Jangan berlatih mandiri bila Anda belum mendapat izin dokter setelah operasi atau memiliki kondisi yang membutuhkan pengawasan klinis langsung.</p>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="name-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">01 //</span><h2 id="name-heading" className="text-lg font-bold uppercase tracking-tight">NAMA PANGGILAN</h2></div>
          <input value={profile.namaPanggilan} onChange={(event) => updateProfile({ namaPanggilan: event.target.value })} placeholder="Contoh: Ibu Hartini" aria-label="Nama panggilan" className="h-14 rounded-2xl border-2 border-black bg-white px-4 text-lg font-semibold text-black outline-none placeholder:text-[#979797] focus:ring-4 focus:ring-[#d1ffca]" />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="capability-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">02 //</span><h2 id="capability-heading" className="text-lg font-bold uppercase tracking-tight">KAPABILITAS GERAK</h2></div>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Kapabilitas gerak">
            {capabilityOptions.map((option) => {
              const selected = profile.kapabilitas === option.id;
              return <Card key={option.id} role="radio" aria-checked={selected} tabIndex={0} onClick={() => updateProfile({ kapabilitas: option.id })} className={`cursor-pointer rounded-3xl border-2 p-5 shadow-none ${selected ? 'border-black bg-white ring-4 ring-[#d1ffca]' : 'border-[#c6c6c6] bg-white hover:border-black'}`}><CardContent className="flex items-start justify-between gap-3 p-0"><div><h3 className="text-lg font-bold text-black">{option.title}</h3><p className="mt-1 text-sm font-medium text-[#444444]">{option.description}</p></div>{selected && <CheckCircle2 className="size-7 shrink-0 text-black" />}</CardContent></Card>;
            })}
          </div>
        </section>

        <div className="p-3.5 bg-[#d1ffca] rounded-2xl border border-[#000000] text-xs text-[#000000] font-medium">
          <strong>Arti sudut fleksi:</strong> berdiri tegak = 0°, sudut siku-siku = 90°,
          sedangkan 100° berarti lutut menekuk lebih dalam dari siku-siku. Angka ini bukan
          sudut internal antara paha dan betis.
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="target-knee-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">03 //</span><h2 id="target-knee-heading" className="text-lg font-bold uppercase tracking-tight">SISI LUTUT TARGET</h2></div>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Sisi lutut target">
            {TARGET_KNEE_OPTIONS.map((option) => {
              const selected = profile.targetKnee === option.id;
              return (
                <Card key={option.id} role="radio" aria-checked={selected} tabIndex={0} onClick={() => updateProfile({ targetKnee: option.id })} className={`cursor-pointer rounded-3xl border-2 p-4 shadow-none ${selected ? 'border-black bg-white ring-4 ring-[#d1ffca]' : 'border-[#c6c6c6] bg-white hover:border-black'}`}>
                  <CardContent className="flex items-start justify-between gap-2 p-0">
                    <div>
                      <h3 className="text-base font-bold text-black">{option.title}</h3>
                      <p className="mt-0.5 text-xs font-medium text-[#444444]">{option.desc}</p>
                    </div>
                    {selected && <Target className="size-6 shrink-0 text-black" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="assistance-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">04 //</span><h2 id="assistance-heading" className="text-lg font-bold uppercase tracking-tight">STATUS PENDAMPINGAN</h2></div>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Status pendampingan">
            {assistanceOptions.map((option) => {
              const selected = profile.pendampingan === option.id;
              return <Card key={option.id} role="radio" aria-checked={selected} tabIndex={0} onClick={() => updateProfile({ pendampingan: option.id })} className={`cursor-pointer rounded-3xl border-2 p-5 shadow-none ${selected ? 'border-black bg-white ring-4 ring-[#d1ffca]' : 'border-[#c6c6c6] bg-white hover:border-black'}`}><CardContent className="flex items-start justify-between gap-3 p-0"><div><h3 className="text-lg font-bold text-black">{option.title}</h3><p className="mt-1 text-sm font-medium text-[#444444]">{option.description}</p></div>{selected && <HeartHandshake className="size-7 shrink-0 text-black" />}</CardContent></Card>;
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="target-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">05 //</span><h2 id="target-heading" className="text-lg font-bold uppercase tracking-tight">TARGET REPETISI PER SESI</h2></div>
          <Card className="rounded-3xl border-none bg-white p-5 shadow-none"><div className="flex items-center gap-4"><input type="range" min="2" max="20" step="1" value={profile.targetRepetisiPerSesi} onChange={(event) => updateProfile({ targetRepetisiPerSesi: Number(event.target.value) })} aria-label="Target repetisi per sesi" className="w-full accent-black" /><output className="min-w-16 rounded-xl bg-black px-3 py-2 text-center font-mono text-xl font-bold text-[#d1ffca]">{profile.targetRepetisiPerSesi}x</output></div><div className="mt-2 flex justify-between font-mono text-xs font-bold text-[#444444]"><span>2 REP</span><span>20 REP</span></div></Card>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="family-heading">
          <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-[#979797]">06 //</span><h2 id="family-heading" className="text-lg font-bold uppercase tracking-tight">KONTAK KELUARGA <span className="text-sm font-medium normal-case text-[#979797]">(opsional)</span></h2></div>
          <input value={profile.kontakKeluarga ?? ''} onChange={(event) => updateProfile({ kontakKeluarga: event.target.value || undefined })} placeholder="Nomor WhatsApp atau telepon" aria-label="Kontak keluarga" className="h-14 rounded-2xl border-2 border-black bg-white px-4 text-lg font-semibold text-black outline-none placeholder:text-[#979797] focus:ring-4 focus:ring-[#d1ffca]" />
        </section>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 z-20 mx-auto flex w-full max-w-md gap-2 bg-[#e5e5e5]/95 p-4 backdrop-blur-md md:max-w-2xl lg:max-w-3xl"><Button type="button" onClick={() => navigate('/calibration')} className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-black text-sm font-extrabold uppercase tracking-tight text-white shadow-none hover:bg-[#2f2f2f] sm:text-base"><span>LANJUTKAN</span><ArrowRight className="size-5 shrink-0" /></Button><Button type="button" variant="outline" onClick={() => navigate('/reference-recorder')} className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-black bg-white px-3 text-xs font-bold uppercase text-black shadow-none sm:px-4 sm:text-sm" aria-label="Buka perekam data referensi" title="Perekam data referensi"><Database className="size-5" /><span className="hidden sm:inline">GOLDEN DATA</span></Button></footer>
    </AppLayout>
  );
}
