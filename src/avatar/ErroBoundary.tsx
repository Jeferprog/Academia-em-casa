// Proteção: se o avatar 3D (experimental) falhar em qualquer aparelho — WebGL
// indisponível, erro ao carregar o modelo, etc. — cai de volta no avatar SVG
// sem quebrar a tela de treino.

import { Component, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

export default class ErroBoundary extends Component<Props, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(erro: unknown) {
    console.error('Avatar 3D falhou, usando o SVG:', erro)
  }

  render() {
    return this.state.erro ? this.props.fallback : this.props.children
  }
}
