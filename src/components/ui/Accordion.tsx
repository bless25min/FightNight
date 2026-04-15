import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  id: string
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

export function Accordion({ id, question, answer, isOpen, onToggle }: Props) {
  return (
    <div data-faq={id} className="border-b border-pearl/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-5 md:py-6 flex items-center justify-between text-left gap-4 group cursor-pointer"
      >
        <span className="text-base md:text-lg font-heading font-medium text-pearl group-hover:text-neon transition-colors duration-300">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl text-mist flex-shrink-0 leading-none"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 md:pb-6 text-mist leading-relaxed pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
