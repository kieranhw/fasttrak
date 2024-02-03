export const StageIndicators = ({ currentStage, totalStages }: { currentStage: number; totalStages: number }) => {
    return (
        <div className="h-2 mt-4 flex justify-center gap-2">
            {Array.from({ length: totalStages }).map((_, index) => (
                <div
                    key={index}
                    className={`border rounded-lg h-2 w-2 ${index + 1 === currentStage ? 'border-primary bg-primary' : 'bg-card'}`}
                ></div>
            ))}
        </div>
    );
};
