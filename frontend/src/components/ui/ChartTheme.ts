/**
 * Shared Recharts Theme for NeuroFusion AI Multimodal Neuroscience Platform
 * Soft, editorial, calm, muted green and slate-blue tones
 */

export const ChartColors = {
  // Primary modalities
  eeg: '#1F4D45',            // Forest green
  eegAlt: '#2E9E73',         // Vibrant healthy green
  mri: '#4F6D8F',            // Slate-blue
  fusion: '#1F4D45',         // Primary dark green
  
  // Clinical semantics
  healthy: '#2E9E73',        // Soft healthy green
  risk: '#C8475A',           // Muted risk rose
  warning: '#D99A2B',        // Muted amber
  neutral: '#7A8A87',        // Muted gray-green
  
  // Chrome & Layout
  grid: '#E3ECE9',           // Thin soft border grid
  axisText: '#7A8A87',       // Muted axis labels
  tooltipBg: '#FFFFFF',      // White tooltip container
  tooltipBorder: '#D5E2DF',  // Thin border
  textDark: '#3A4A47',       // Body dark text
  textMuted: '#7A8A87',
  
  // Sequential scales for heatmaps / matrices
  sequentialGreen: ['#F2F8F6', '#DCE9E6', '#B9EDE6', '#8FD9CF', '#557A74', '#1F4D45'],
  divergingRoseToGreen: ['#FBEDF0', '#E5A2AC', '#E8F1EF', '#A9DCD3', '#1F4D45'],
};

export const defaultTooltipStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#D5E2DF',
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(31, 77, 69, 0.08)',
  color: '#3A4A47',
  fontSize: '12px',
  fontFamily: 'Inter, sans-serif',
  padding: '8px 12px',
};
