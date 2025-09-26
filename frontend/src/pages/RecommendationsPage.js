const RecommendationsPage = ({ recommendations }) => {
  console.log("Recommendations Data:", recommendations);  // Log the data
  return (
    <div className="recommendations">
      {recommendations.map((resume) => {
        // Ensure the score is included in the resume object
        const resumeWithScore = { ...resume, score: resume.score || 0 };
        return <ResumeCard key={resume.id} resume={resumeWithScore} />;
      })}
    </div>
  );
}; 