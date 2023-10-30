import { useEffect } from 'react';
import { displayGraph } from '@/lib/routing/model/cytoscape';
import { Graph } from '@/lib/routing/model/graph';
import { VRPSolution } from '@/lib/routing/model/vrp';

interface Props {
  graph: Graph;
  solution: VRPSolution;
}

export const CytoscapeGraph: React.FC<Props> = ({ graph, solution }) => {
  useEffect(() => {
    displayGraph(graph, solution); 
  }, [graph, solution]);

  return (
    <div id="cy" className="w-full h-[500px] border-divider border rounded-md my-2 overflow-hidden bg-card" />
  );
};
