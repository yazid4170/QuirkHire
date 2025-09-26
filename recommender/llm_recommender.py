"""
LLM-based resume recommendation system using OpenRouter and Llama models.
This module provides an alternative to the traditional NLP-based approach,
offering more advanced reasoning capabilities for resume matching.
"""

import json
import logging
import os
import time
import uuid
import traceback
from functools import lru_cache
from django.conf import settings
from openai import OpenAI
from dotenv import load_dotenv

logger = logging.getLogger('recommender')

# Load environment variables from .env file
load_dotenv(dotenv_path=".env", override=True)

# Get OpenRouter API key directly from .env file
try:
    with open(".env", "r") as f:
        env_contents = f.read()
    
    # Find the specific line with OPENROUTER_API_KEY
    for line in env_contents.split("\n"):
        if line.startswith("OPENROUTER_API_KEY="):
            ROUTER_API_KEY = line.split("=", 1)[1].strip()
            break
    else:
        # Fallback to settings if not found in .env
        ROUTER_API_KEY = getattr(settings, "OPENROUTER_API_KEY", "")
    
    # Log that we found the key (without showing the full key)
    key_preview = "*" * (len(ROUTER_API_KEY) - 8) + ROUTER_API_KEY[-8:] if ROUTER_API_KEY else "None"
    logger.info(f"OpenRouter API key loaded: {key_preview}")
    
except Exception as e:
    logger.error(f"Error loading API key from .env: {str(e)}")
    # Fallback to settings
    ROUTER_API_KEY = getattr(settings, "OPENROUTER_API_KEY", "")

# Log API key status (safely)
if ROUTER_API_KEY:
    # Strip any whitespace that might have been added accidentally
    ROUTER_API_KEY = ROUTER_API_KEY.strip()
    masked_key = f"{ROUTER_API_KEY[:10]}...{ROUTER_API_KEY[-4:]}" if len(ROUTER_API_KEY) > 14 else "***masked***"
    logger.info(f"OpenRouter API key found: {masked_key}")
else:
    logger.error(
        "OpenRouter API key missing! LLM recommendations will not work.\n"
        "Please add OPENROUTER_API_KEY in your .env file or Django settings."
    )

# Initialize OpenRouter client
try:
    # Clean any whitespace from API key
    cleaned_api_key = ROUTER_API_KEY.strip() if ROUTER_API_KEY else ""
    
    # Check if API key is valid
    if not cleaned_api_key:
        logger.error("OpenRouter API key is missing or empty")
    
    # Initialize with proper headers
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=cleaned_api_key,
        default_headers={
            "HTTP-Referer": getattr(settings, "SITE_URL", "https://careerreco.app"),
            "X-Title": "CareerReco"
        }
    )
    logger.info("OpenRouter client initialized successfully")
    
    # Test connection with a simple completion (commented out for now)
    # test = client.chat.completions.create(
    #    model="meta-llama/llama-4-maverick:free",
    #    messages=[{"role": "user", "content": "Hello"}],
    #    max_tokens=5
    # )
    # logger.info(f"OpenRouter connection test successful: {test.model}")
    
except Exception as e:
    logger.error(f"Failed to initialize OpenRouter client: {str(e)}")
    logger.error(traceback.format_exc())

# LLM Models available
LLM_MODELS = {
    "llama4": "meta-llama/llama-4-maverick:free"
}

# Default model to use
DEFAULT_LLM_MODEL = "llama4"

def format_resume_for_llm(resume):
    """Convert resume dict to a formatted text string for LLM processing"""
    sections = []
    
    # Add name and contact if available
    name = resume.get('name', '')
    if not name or name.strip() == '':
        name = f"Candidate {resume.get('user_id', 'Unknown')[:8]}"
    sections.append(f"# {name}")
    
    # Add education
    education = resume.get('education', [])
    if education and isinstance(education, list) and len(education) > 0:
        edu_list = []
        for edu in education:
            degree = edu.get('degree', '')
            institution = edu.get('institution', '')
            if degree and institution:
                edu_list.append(f"{degree} at {institution}")
        if edu_list:
            sections.append("Education:\n- " + "\n- ".join(edu_list))
    else:
        sections.append("Education: No formal education listed")
    
    # Add experience
    experience = resume.get('experience', [])
    if experience and isinstance(experience, list) and len(experience) > 0:
        exp_list = []
        for exp in experience:
            position = exp.get('position', '')
            company = exp.get('company', '')
            description = exp.get('description', '')
            if position and company:
                exp_details = f"{position} at {company}"
                if description:
                    exp_details += f": {description}"
                exp_list.append(exp_details)
        if exp_list:
            sections.append("Experience:\n- " + "\n- ".join(exp_list))
    else:
        sections.append("Experience: No work experience listed")
    
    # Add skills
    skills = resume.get('skills', [])
    if skills and isinstance(skills, list) and len(skills) > 0:
        sections.append("Skills: " + ", ".join(skills))
    else:
        sections.append("Skills: No specific skills listed")
    
    # Add languages
    languages = resume.get('languages', [])
    if languages and isinstance(languages, list) and len(languages) > 0:
        lang_strs = []
        for lang in languages:
            if isinstance(lang, str):
                lang_strs.append(lang)
            elif isinstance(lang, dict):
                name = lang.get('name', '')
                fluency = lang.get('fluency')
                if fluency:
                    lang_strs.append(f"{name} - {fluency}")
                else:
                    lang_strs.append(name)
        if lang_strs:
            sections.append("Languages: " + ", ".join(lang_strs))
    
    # Add certifications
    certifications = resume.get('certifications', [])
    if certifications and isinstance(certifications, list) and len(certifications) > 0:
        sections.append("Certifications: " + ", ".join(certifications))
    
    return "\n\n".join(sections)

@lru_cache(maxsize=100)
def get_llm_evaluation(job_desc, resume_text, model_name=DEFAULT_LLM_MODEL):
    # Add request tracing
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] Starting LLM evaluation with model: {model_name}")
    """
    Use LLM to evaluate how well a resume matches a job description.
    Caches results to avoid repeated API calls.
    """
    start_time = time.time()
    request_id = f"req_{int(time.time())}_{model_name[:4]}"
    logger.info(f"[{request_id}] Starting LLM evaluation with model: {model_name}")
    
    # Check for API key before making the call
    if not ROUTER_API_KEY:
        logger.error(f"[{request_id}] Cannot perform evaluation: OpenRouter API key is missing")
        return {
            "score": 50,
            "reasoning": "OpenRouter API key is missing. Unable to perform LLM evaluation.",
            "error": True,
            "missing_api_key": True
        }
    
    try:
        system_prompt = """You are an expert resume analyst and hiring consultant with deep knowledge of various industries and roles.
Your task is to evaluate how well a candidate's resume matches a job description.
Provide a detailed analysis including a match score and specific reasoning.

IMPORTANT: Your response MUST be a valid, properly formatted JSON object with the following structure:
{
  "score": 85,
  "reasoning": "Text explanation of the match scoring",
  "skill_match": [
    {"skill": "Python", "match": true, "importance": "critical"},
    {"skill": "AWS", "match": false, "importance": "preferred"}
  ],
  "experience_match": "String describing how well experience matches",
  "education_match": "String describing how well education matches",
  "strengths": ["String array of candidate strengths for this role"],
  "weaknesses": ["String array of candidate gaps for this role"]
}

DO NOT include any text outside the JSON object. Do not include markdown formatting, code blocks, or explanations. Return ONLY the JSON object itself."""

        user_prompt = f"""Please evaluate how well this candidate matches the job description.

JOB DESCRIPTION:
{job_desc}

RESUME:
{resume_text}

Provide a comprehensive analysis of the match. Consider:
1. Technical skills alignment (critical skills vs. nice-to-have)
2. Years and relevance of experience
3. Educational qualifications
4. Seniority level match
5. Overall suitability

Score the match from 0-100 and explain your reasoning in the required JSON format.
"""

        # Log request details
        logger.info(f"[{request_id}] Sending request to OpenRouter with {len(job_desc)} chars job description and {len(resume_text)} chars resume")
        logger.info(f"[{request_id}] Using model: {LLM_MODELS.get(model_name, LLM_MODELS[DEFAULT_LLM_MODEL])}")
        
        try:
            # Test with a simple static prompt first - if this works, your key is valid
            logger.info(f"[{request_id}] Attempting OpenRouter API call with model: {model_name}")
            
            # Use a simpler model and prompt for testing if needed
            # test_model = "meta-llama/llama-4-maverick:free"
            # logger.info(f"[{request_id}] Testing API connection with model: {test_model}")
            
            # Prepare a clean API key
            api_key = ROUTER_API_KEY.strip() if ROUTER_API_KEY else ""
            
            # Generate headers separately for clarity
            headers = {
                "HTTP-Referer": getattr(settings, "SITE_URL", "https://careerreco.app"),
                "X-Title": "CareerReco"
            }
            
            # Prepare the model to use
            selected_model = LLM_MODELS.get(model_name, LLM_MODELS[DEFAULT_LLM_MODEL])
            logger.info(f"[{request_id}] Using model: {selected_model}")
            
            # Make the API call with explicit JSON formatting parameters
            completion = client.chat.completions.create(
                extra_headers=headers,
                model=selected_model,
                response_format={"type": "json_object"},  # Request JSON format explicitly
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                    # Add an explicit instruction as the last message to ensure JSON formatting
                    {"role": "assistant", "content": "I'll analyze this match and provide a JSON response."}
                ],
                temperature=0.1,  # Lower temperature for more consistent outputs
                max_tokens=1500,  # Increase token limit to ensure complete response
                top_p=0.9,       # More focused sampling
                presence_penalty=0.1,  # Slight penalty for repetition
                seed=42          # Use consistent seed for more predictable outputs
            )
            logger.info(f"[{request_id}] Received response from OpenRouter: {completion.model}")
        except Exception as e:
            logger.error(f"[{request_id}] OpenRouter API call failed: {str(e)}")
            raise
        
        response_text = completion.choices[0].message.content
        logger.info(f"[{request_id}] Raw response length: {len(response_text)} chars")
        
        # Parse the JSON response
        try:
            logger.debug(f"[{request_id}] Response content: {response_text[:500]}...")
            
            # Check if we have a meaningful response
            if not response_text or len(response_text) < 5:  # Arbitrary minimum length
                logger.error(f"[{request_id}] Response too short or empty: '{response_text}'")
                raise ValueError("Response too short or empty")
            
            # Import regex library if needed
            import re
            
            # SIMPLIFIED APPROACH: Create a simple default result from the response
            # This will work even if the JSON is malformed or truncated
            default_result = {
                "score": 50,
                "reasoning": "Parsing the full response was not possible.",
                "skill_match": [],
                "experience_match": "Unknown",
                "education_match": "Unknown",
                "strengths": [],
                "weaknesses": []
            }
            
            # Try to extract just the score and reasoning which appear at the beginning
            score_match = re.search(r'"score"\s*:\s*(\d+)', response_text)
            if score_match:
                try:
                    default_result["score"] = int(score_match.group(1))
                    logger.info(f"[{request_id}] Successfully extracted score: {default_result['score']}")
                except:
                    pass
            
            reasoning_match = re.search(r'"reasoning"\s*:\s*"([^"]+)"', response_text)
            if reasoning_match:
                default_result["reasoning"] = reasoning_match.group(1)
                logger.info(f"[{request_id}] Successfully extracted reasoning")
            
            # Try one last time to parse the entire JSON properly
            try:
                clean_text = response_text.strip()
                if '{' in clean_text and '}' in clean_text:
                    start = clean_text.find('{')
                    end = clean_text.rfind('}')
                    if start >= 0 and end > start:
                        result = json.loads(clean_text[start:end+1])
                        logger.info(f"[{request_id}] Successfully parsed full JSON")
                        return result
            except:
                logger.warning(f"[{request_id}] Full JSON parsing failed, using extracted values")
                pass
                
            # Return our default result with extracted values
            return default_result
            
            # Ensure we have the expected fields or provide defaults
            if 'score' not in result:
                logger.warning(f"[{request_id}] Missing 'score' field in response, using default")
                result['score'] = 50
            if 'reasoning' not in result:
                logger.warning(f"[{request_id}] Missing 'reasoning' field in response, using default")
                result['reasoning'] = "Analysis could not be generated properly."
                
            # Log performance metrics and result summary
            duration = time.time() - start_time
            logger.info(f"[{request_id}] LLM evaluation completed in {duration:.2f} seconds")
            logger.info(f"[{request_id}] Score: {result.get('score')}, Error: {result.get('error', False)}")
            
            return result
            
        except json.JSONDecodeError as json_err:
            logger.error(f"[{request_id}] LLM returned invalid JSON: {response_text[:200]}...")
            logger.error(f"[{request_id}] Full response: {response_text}")
            
            # As a fallback, try to create a valid response from the model output
            fallback_result = {
                "score": 50,
                "reasoning": "Error parsing LLM response: invalid JSON format",
                "error": True,
                "json_error": True
            }
            
            # Try to extract a score from the text if possible
            try:
                # Look for patterns like "score: 85" or "score is 85"
                import re
                score_match = re.search(r'score[:\s]+(\d+)', response_text, re.IGNORECASE)
                if score_match:
                    fallback_result["score"] = min(100, max(0, int(score_match.group(1))))
                    logger.info(f"[{request_id}] Extracted fallback score: {fallback_result['score']}")
            except Exception as extract_err:
                logger.error(f"[{request_id}] Error extracting fallback score: {str(extract_err)}")
            
            return fallback_result
            
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"[{request_id}] Error during LLM evaluation: {str(e)}")
        logger.error(f"[{request_id}] Traceback: {error_trace}")
        return {
            "score": 0,
            "reasoning": f"Error during evaluation: {str(e)}",
            "error": True,
            "exception": str(e)
        }

def recommend_resumes_llm(job_desc, resumes, top_n=5, model_name=DEFAULT_LLM_MODEL):
    """
    Recommend resumes for a job description using LLM-based matching.
    
    Args:
        job_desc (str): The job description text
        resumes (list): List of resume dictionaries
        top_n (int): Number of top recommendations to return
        model_name (str): Name of the LLM model to use
        
    Returns:
        list: Top N resume recommendations with scores and explanations
    """
    start_time = time.time()
    logger.info(f"Starting LLM-based recommendation for {len(resumes)} resumes")
    
    if not resumes:
        logger.error("No resumes provided to LLM recommender")
        return []
        
    # For debugging - check first resume structure
    if len(resumes) > 0:
        logger.info(f"First resume structure: user_id={resumes[0].get('user_id')}, skills={len(resumes[0].get('skills', []))}, experience={len(resumes[0].get('experience', []))}")
    
    results = []
    success_count = 0
    error_count = 0
    
    for i, resume in enumerate(resumes):
        try:
            # Generate resume text for LLM
            resume_text = format_resume_for_llm(resume)
            logger.debug(f"Resume {i+1} text length: {len(resume_text)} chars")
            
            # Get LLM evaluation (with error handling)
            try:
                # For debugging - print API key without showing full key
                api_key_preview = "*" * (len(ROUTER_API_KEY.strip()) - 4) + ROUTER_API_KEY.strip()[-4:] if ROUTER_API_KEY else "None"
                logger.info(f"Using API key: {api_key_preview}")
                
                evaluation = get_llm_evaluation(job_desc, resume_text, model_name)
                success_count += 1
            except Exception as e:
                logger.error(f"Error evaluating resume {i}: {str(e)}")
                # Use fallback evaluation with basic score
                evaluation = {
                    'score': 50,  # Default middle score
                    'reasoning': f"Basic matching due to technical limitations. This candidate may have relevant skills and experience, but detailed analysis was not possible.",
                    'strengths': ["Resume contains relevant keywords", "Basic qualifications met"],
                    'weaknesses': ["Unable to perform detailed analysis"],
                    'error': True
                }
                error_count += 1
            
            # Normalize score to 0-1 range
            normalized_score = evaluation.get('score', 0) / 100
            
            # Generate match reasons from evaluation - formatted to match NLP model display
            match_reasons = []
            
            # First add the main reasoning as a long paragraph (will be displayed at the top)
            if 'reasoning' in evaluation and evaluation['reasoning']:
                match_reasons.append(evaluation['reasoning'])
                
            # Then add strengths with the exact format that ResumeCard.jsx expects
            if 'strengths' in evaluation and evaluation['strengths']:
                for strength in evaluation['strengths']:
                    match_reasons.append(f"✓ Strength: {strength}")
                    
            # Then add weaknesses/gaps with the exact format that ResumeCard.jsx expects
            if 'weaknesses' in evaluation and evaluation['weaknesses']:
                for weakness in evaluation['weaknesses']:
                    match_reasons.append(f"△ Gap: {weakness}")
                
            # Add skill matches if available
            if 'skill_match' in evaluation and evaluation['skill_match']:
                for skill in evaluation['skill_match']:
                    if isinstance(skill, dict) and 'skill' in skill and 'match' in skill:
                        if skill['match']:
                            match_reasons.append(f"✓ Strength: Has required skill: {skill['skill']}")
                        else:
                            match_reasons.append(f"△ Gap: Missing skill: {skill['skill']}")
            
            # Add to results
            results.append({
                'resume': resume,
                'score': normalized_score,
                'raw_score': evaluation.get('score', 0),
                'reasoning': evaluation.get('reasoning', ''),
                'skill_match': evaluation.get('skill_match', []),
                'experience_match': evaluation.get('experience_match', ''),
                'education_match': evaluation.get('education_match', ''),
                'strengths': evaluation.get('strengths', []),
                'weaknesses': evaluation.get('weaknesses', []),
                'match_reasons': match_reasons
            })
            
        except Exception as e:
            logger.error(f"Critical error processing resume {i}: {str(e)}")
            logger.error(traceback.format_exc())
    
    # Sort results by score in descending order
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Ensure we have at least some results (fallback to original resumes if no evaluations succeeded)
    if not results and resumes:
        logger.warning("No results from LLM evaluation - using fallback with default scores")
        for i, resume in enumerate(resumes[:top_n]):
            results.append({
                'resume': resume,
                'score': 0.5,  # Default middle score
                'raw_score': 50,
                'reasoning': "This candidate may be a good match, but we couldn't analyze the details automatically. Consider reviewing their skills and experience manually.",
                'match_reasons': [
                    "This candidate may be a good match, but we couldn't analyze the details automatically. Consider reviewing their skills and experience manually.", 
                    "✓ Strength: Resume contains basic qualifications", 
                    "✓ Strength: Candidate has relevant background",
                    "△ Gap: Unable to perform detailed analysis"
                ]
            })
    
    # Take top N results
    top_results = results[:top_n]
    
    # Log performance metrics
    duration = time.time() - start_time
    logger.info(f"LLM recommendation completed in {duration:.2f} seconds with {success_count} successes and {error_count} errors")
    logger.info(f"Returning {len(top_results)} recommendations")
    
    return top_results

def hybrid_recommend_resumes(job_desc, resumes, top_n=5, nlp_weight=0.4, llm_weight=0.6, 
                            nlp_func=None, model_name=DEFAULT_LLM_MODEL):
    """
    Hybrid recommendation combining traditional NLP and LLM approaches.
    
    Args:
        job_desc (str): The job description text
        resumes (list): List of resume dictionaries
        top_n (int): Number of top recommendations to return
        nlp_weight (float): Weight for NLP-based scores (0-1)
        llm_weight (float): Weight for LLM-based scores (0-1)
        nlp_func (callable): Function to call for NLP-based recommendations
        model_name (str): Name of the LLM model to use
        
    Returns:
        list: Top N resume recommendations with combined scores
    """
    from .utils import recommend_resumes as default_nlp_func
    
    if nlp_func is None:
        nlp_func = default_nlp_func
    
    # Phase 1: Get traditional NLP recommendations with scores
    nlp_results = nlp_func(job_desc, resumes, top_n=len(resumes))
    
    # Create a map of resume ID to NLP score
    nlp_scores = {}
    for result in nlp_results:
        # Check if the result has a nested 'resume' key or if the resume data is directly in the result
        if 'resume' in result and isinstance(result['resume'], dict) and 'id' in result['resume']:
            nlp_scores[result['resume']['id']] = result['score']
        elif 'id' in result:  # If the resume data is directly in the result
            nlp_scores[result['id']] = result['score']
        else:
            logger.warning(f"Skipping NLP result with unexpected structure: {result}")
    
    # Phase 2: Get LLM recommendations for top candidates from NLP
    # Only process top 20 or all if less than 20 to save API costs
    top_nlp_candidates = []
    for r in nlp_results[:min(20, len(nlp_results))]:
        if 'resume' in r and isinstance(r['resume'], dict):
            top_nlp_candidates.append(r['resume'])
        elif 'id' in r:  # If the resume data is directly in the result
            top_nlp_candidates.append(r)
    logger.info(f"Selected {len(top_nlp_candidates)} top candidates for LLM evaluation")
    llm_results = recommend_resumes_llm(job_desc, top_nlp_candidates, top_n=len(top_nlp_candidates), model_name=model_name)
    
    # Create a map of resume ID to LLM score
    llm_scores = {}
    for result in llm_results:
        if 'resume' in result and isinstance(result['resume'], dict) and 'id' in result['resume']:
            llm_scores[result['resume']['id']] = result['score']
    
    # Phase 3: Combine scores
    combined_results = []
    for resume_id, nlp_score in nlp_scores.items():
        # If we have an LLM score for this resume, combine them
        if resume_id in llm_scores:
            llm_score = llm_scores[resume_id]
            combined_score = (nlp_weight * nlp_score) + (llm_weight * llm_score)
            
            # Find the full result objects to get reasoning
            nlp_result = next((r for r in nlp_results if ('resume' in r and r['resume'].get('id') == resume_id) or r.get('id') == resume_id), None)
            llm_result = next((r for r in llm_results if 'resume' in r and r['resume'].get('id') == resume_id), None)
            
            if nlp_result and llm_result:
                # Get the resume data from the appropriate location
                resume_data = nlp_result.get('resume') if 'resume' in nlp_result else nlp_result
                combined_results.append({
                    'resume': resume_data,
                    'score': combined_score,
                    'nlp_score': nlp_score,
                    'llm_score': llm_score,
                    'nlp_reasoning': nlp_result.get('reasoning', ''),
                    'llm_reasoning': llm_result.get('reasoning', ''),
                    'skill_match': llm_result.get('skill_match', []),
                    'strengths': llm_result.get('strengths', []),
                    'weaknesses': llm_result.get('weaknesses', [])
                })
        else:
            # For resumes that weren't evaluated by LLM, just use the NLP score
            # This shouldn't happen often with our design, but handles edge cases
            nlp_result = next((r for r in nlp_results if ('resume' in r and r['resume'].get('id') == resume_id) or r.get('id') == resume_id), None)
            if nlp_result:
                # Get the resume data from the appropriate location
                resume_data = nlp_result.get('resume') if 'resume' in nlp_result else nlp_result
                combined_results.append({
                    'resume': resume_data,
                    'score': nlp_score * (nlp_weight + llm_weight),  # Scale up to compensate
                    'nlp_score': nlp_score,
                    'llm_score': 0,
                    'nlp_reasoning': nlp_result.get('reasoning', ''),
                    'llm_reasoning': "Not evaluated by LLM"
                })
    
    # Sort by combined score
    combined_results.sort(key=lambda x: x['score'], reverse=True)
    
    # Return top N
    return combined_results[:top_n]
