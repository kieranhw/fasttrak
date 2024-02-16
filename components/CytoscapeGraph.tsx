import { useEffect } from 'react';
import { displayGraph } from '../lib/utils/cytoscape-data'
import { Graph } from '@/lib/routing/models/graph';
import { VRPSolution } from '@/lib/routing/models/vrp';

interface Props {
  graph: Graph;
  solution: VRPSolution;
}

export const CytoscapeGraph: React.FC<Props> = ({ graph, solution }) => {

  useEffect(() => {
      displayGraph(graph, solution);
  }, [graph, solution]);

  return (
    <div id="cy" className="w-full h-full overflow-hidden bg-card rounded-md" />
  );
};
