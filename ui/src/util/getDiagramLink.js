export default function getDiagramLink(diagram) {
  return (diagram && diagram.id) ? `/diagrams/${diagram.id}` : null;
}
