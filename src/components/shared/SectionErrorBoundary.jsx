import React from 'react';
import logger from '@/lib/utils/logger';

/**
 * Lightweight error boundary for individual dashboard sections.
 * If a widget/card crashes, it shows a minimal fallback instead of
 * taking down the entire page.
 */
class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error(`[SectionError] ${this.props.name || 'unknown'}:`, error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing — the section silently disappears instead of crashing the page
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;
