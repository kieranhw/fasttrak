export const StageIndicators = ({ currentStage, totalStages }: { currentStage: number; totalStages: number }) => {
    return (
        <div className="h-4 mt-4 flex justify-center gap-2 items-center">
            {Array.from({ length: totalStages }).map((_, index) => (
                <div
                    key={index}
                    className={`border h-1 w-8 ${index + 1 === currentStage ? 'border-primary bg-primary' : 'bg-border'}`}
                ></div>
            ))}
        </div>
    );
};
