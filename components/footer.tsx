import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-16">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Desvendando a Bíblia</h3>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Mail className="h-4 w-4" />
            <span>Contato:</span>
            <a href="mailto:desvendandobiblia@outlook.com" className="text-white hover:text-gray-300 transition-colors">
              desvendandobiblia@outlook.com
            </a>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400">© 2024 Desvendando a Bíblia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
