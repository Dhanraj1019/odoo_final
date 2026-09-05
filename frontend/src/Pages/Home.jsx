import HorizontalLine from '../components/HorizontalLine'
import { useSelector } from "react-redux";
import DatabaseObj from '../../Supabase/database'
import { useEffect, useState } from 'react'
import { CalendarX, UsersRound } from 'lucide-react'

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="my-4 flex min-h-32 w-full items-center justify-center border border-neon-cyan/20 bg-bg-surface/60 px-4 py-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <p className="font-mono text-sm uppercase tracking-wider text-text-muted sm:text-base">
          {message}
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const role=useSelector((state)=>state.auth.role);
  return (
    <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-8'>

      {/* <div className='h-px gradient-line my-12 md:my-16 opacity-30'></div> */}
      <section id='about-us'>

      </section>
      <div className="h-16"></div>
    </div>
  )
}
