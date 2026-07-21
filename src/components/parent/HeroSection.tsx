import { motion } from "framer-motion";

interface HeroSectionProps {
  parentName: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
};

const HeroSection = ({ parentName }: HeroSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-green-deep via-green-mid to-green-deep text-primary-foreground shadow-sm"
      style={{ minHeight: 170 }}
    >
      {/* Pattern islami halus */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M30 4l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-islamic-pattern)" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-6 px-6 py-8 md:px-10 md:py-10">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-primary-foreground/75 mb-1">
            Assalamu'alaikum, {getGreeting()}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            Bapak/Ibu {parentName}
          </h1>
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-xl">
            Pantau perkembangan belajar ananda hari ini.
          </p>
        </div>

        {/* Ilustrasi islami — hidden di mobile */}
        <div className="hidden md:block shrink-0" aria-hidden="true">
          <svg width="150" height="130" viewBox="0 0 150 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bulan sabit */}
            <path
              d="M118 22a14 14 0 1 0 10 23 11 11 0 1 1-10-23z"
              fill="hsl(var(--gold))"
            />
            {/* Bintang */}
            <path
              d="M138 55l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z"
              fill="hsl(var(--gold-light))"
            />
            <path
              d="M22 20l1.2 2.5 2.8.3-2.1 1.8.6 2.7-2.5-1.4-2.5 1.4.6-2.7-2.1-1.8 2.8-.3z"
              fill="hsl(var(--gold-light))"
            />
            {/* Masjid: bangunan */}
            <rect x="45" y="70" width="70" height="45" rx="2" fill="hsl(var(--gold))" opacity="0.9" />
            {/* Kubah utama */}
            <path
              d="M60 70c0-11 8-20 20-20s20 9 20 20H60z"
              fill="hsl(var(--gold-light))"
            />
            <circle cx="80" cy="47" r="2" fill="hsl(var(--gold))" />
            <path d="M80 41v6" stroke="hsl(var(--gold))" strokeWidth="1.5" strokeLinecap="round" />
            {/* Menara kiri */}
            <rect x="40" y="60" width="8" height="55" rx="1" fill="hsl(var(--gold-light))" />
            <path d="M44 55l3 5h-6z" fill="hsl(var(--gold))" />
            {/* Menara kanan */}
            <rect x="112" y="60" width="8" height="55" rx="1" fill="hsl(var(--gold-light))" />
            <path d="M116 55l3 5h-6z" fill="hsl(var(--gold))" />
            {/* Pintu */}
            <path
              d="M74 115v-14c0-3 3-6 6-6s6 3 6 6v14"
              fill="hsl(var(--green-deep))"
            />
            {/* Jendela */}
            <circle cx="58" cy="88" r="3" fill="hsl(var(--green-deep))" opacity="0.7" />
            <circle cx="102" cy="88" r="3" fill="hsl(var(--green-deep))" opacity="0.7" />
          </svg>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
