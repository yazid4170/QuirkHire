import json
import numpy as np
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import defaultdict
from functools import lru_cache
import time
import logging
from django.core.cache import cache
from multiprocessing import Pool
from datetime import datetime
from supabase import create_client
from django.conf import settings
import base64
import re
from collections import Counter
from nltk.util import ngrams
from nltk.corpus import stopwords
from string import punctuation
from sklearn.feature_extraction.text import CountVectorizer

# Lazy-load models with simple caching to avoid repeated loading
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        _nlp = spacy.load("en_core_web_sm")
    return _nlp

@lru_cache(maxsize=1)
def get_sentence_transformer():
    """Instantiate SentenceTransformer once per process."""
    model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    # Reduce memory usage
    model.max_seq_length = 128
    return model

# Configuration - Adjust these weights based on importance
WEIGHTS = {
    'similarity': 0.40,  # Increased weight for semantic similarity
    'experience': 0.25,
    'skill_match': 0.20, # Renamed for clarity
    'education': 0.05,
    'languages': 0.05,
    'certifications': 0.05
}

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

__all__ = ['load_resumes', 'enhance_resume_embedding', 'recommend_resumes']

def enhance_resume_embedding(resume):
    """Generate embedding text with contextual emphasis"""
    sections = []
    
    # Education with institution context
    education = []
    for edu in resume.get('education', []):
        institution = (edu.get('institution', '').strip() or 'Unknown Institution')
        degree = edu.get('degree', '')
        education.append(f"Studied {degree} at {institution}")
    if education:
        sections.append("Education Background: " + ". ".join(education))
    
    # Experience with role-specific context
    experience = []
    for exp in resume.get('experience', []):
        company = exp.get('company', 'Unknown Company')
        position = exp.get('position', '')
        description = exp.get('description', '')
        
        # Extract meaningful keywords from description
        keywords = []
        if description:
            doc = get_nlp()(description)
            keywords = [token.text for token in doc if not token.is_stop and token.is_alpha and len(token.text) > 2]
            keywords = keywords[:5]  # limit to top 5 keywords
        
        experience_entry = f"Worked as {position} at {company}"
        if keywords:
            experience_entry += f" with focus on {', '.join(keywords)}"
        experience.append(experience_entry)
    
    if experience:
        sections.append("Professional Experience: " + ". ".join(experience))
    
    # Skills and certifications with categorization
    skills = resume.get('skills', [])
    if skills:
        sections.append("Technical Skills: " + ", ".join(skills))
    
    # Emphasize certifications more prominently
    certs = resume.get('certifications', [])
    if certs:
        sections.append("Certifications Earned: " + ", ".join([cert for cert in certs if cert]))
    
    # Final embedding text
    embedding_text = " ".join(sections)
    
    logger.debug(f"Enhanced embedding text: {embedding_text[:500]}...")
    return embedding_text

def load_resumes():
    """Load resumes from Supabase with enhanced embedding text"""
    try:
        # Fetch resumes
        resumes_response = supabase.table('resumes').select('*').execute()
        resumes = resumes_response.data

        # Fetch profiles
        profiles_response = supabase.table('profiles').select('*').execute()
        profiles = profiles_response.data

        # Join resumes with profiles and ensure all resumes have basic info
        for resume in resumes:
            # Find matching profile
            profile = next((p for p in profiles if p['id'] == resume.get('user_id')), None)
            
            # Add profile data
            if profile:
                first_name = profile.get('first_name', '').strip()
                last_name = profile.get('last_name', '').strip() 
                if first_name or last_name:
                    resume['name'] = f"{first_name} {last_name}".strip()
                else:
                    resume['name'] = f"Candidate {resume.get('user_id', 'Unknown')[:8]}"
                resume['email'] = profile.get('email', '')
                resume['phone'] = profile.get('phone', '')
                resume['address'] = profile.get('address', '')
            else:
                resume['name'] = f"Candidate {resume.get('user_id', 'Unknown')[:8]}"
                
            # Ensure there's always some content in the key fields
            if not resume.get('experience') or not isinstance(resume.get('experience'), list) or len(resume.get('experience', [])) == 0:
                resume['experience'] = [{
                    'position': 'Unspecified Position',
                    'company': 'No company information available',
                    'description': ''
                }]
                
            if not resume.get('education') or not isinstance(resume.get('education'), list) or len(resume.get('education', [])) == 0:
                resume['education'] = [{
                    'degree': 'Unspecified Degree',
                    'institution': 'No institution information available'
                }]
            
            # Ensure skills and other arrays exist
            if not resume.get('skills') or not isinstance(resume.get('skills'), list):
                resume['skills'] = []
                
            if not resume.get('certifications') or not isinstance(resume.get('certifications'), list):
                resume['certifications'] = []
                
            if not resume.get('languages') or not isinstance(resume.get('languages'), list):
                resume['languages'] = []
                

        # Decode Base64 embeddings
        for resume in resumes:
            if resume.get('embedding'):
                embedding_bytes = base64.b64decode(resume['embedding'])
                resume['embedding'] = np.frombuffer(embedding_bytes, dtype='float32')

        # Ensure education is properly formatted
        for resume in resumes:
            # Convert education to list if it's a single object
            if 'education' in resume and isinstance(resume['education'], dict):
                resume['education'] = [resume['education']]
            # Add empty array if education is missing
            if 'education' not in resume:
                resume['education'] = []

        # Add embedding text to resumes
        for resume in resumes:
            resume['embedding_text'] = enhance_resume_embedding(resume)
            
        logger.debug(f"Loaded Resumes: {resumes[:1]}")  # Log first resume
        return resumes
    except Exception as e:
        logger.error(f"Error loading resumes: {str(e)}")
        return []

def extract_keywords_and_requirements(text):
    """Extract job requirements using advanced NLP techniques without domain-specific hardcoding"""
    
    # 1. Use NLP to find requirements based on linguistic patterns
    doc = get_nlp()(text.lower())
    
    # Collect noun phrases that follow skill indicators
    skill_indicators = ['experience in', 'knowledge of', 'skilled in', 'proficient with', 
                       'familiar with', 'expertise in', 'background in', 'ability to',
                       'competent in', 'trained in', 'qualified in', 'specializing in']
    
    skills = []
    
    # Extract based on skill indicators
    for indicator in skill_indicators:
        idx = text.lower().find(indicator)
        if idx >= 0:
            # Extract a meaningful chunk following the indicator
            end_idx = min(idx + len(indicator) + 100, len(text))
            fragment = text[idx + len(indicator):end_idx]
            fragment_doc = get_nlp(fragment)
            
            # Get noun phrases (more meaningful than single nouns)
            for chunk in fragment_doc.noun_chunks:
                if len(chunk.text) > 2:
                    skills.append(chunk.text.strip())
    
    # 2. Extract years of experience using regex
    experience_pattern = r'(\d+)[\+]?\s+years?(?:\s+of)?(?:\s+experience)?'
    years_required = re.findall(experience_pattern, text.lower())
    years = max([int(y) for y in years_required]) if years_required else 0
    
    # 3. Use statistical keyword extraction for remaining skills
    # This uses term frequency to identify domain-relevant terms
    # without requiring predefined lists
    
    # Clean text for keyword extraction
    cleaned_text = " ".join([token.lemma_ for token in doc 
                           if not token.is_stop and not token.is_punct])
    
    # Extract keywords using n-grams (1-3 word phrases)
    try:
        # Configure CountVectorizer for keyword extraction
        count_vectorizer = CountVectorizer(
            ngram_range=(1, 3),  # Use 1-3 word phrases
            stop_words='english',
            min_df=1,  # Minimum document frequency
            max_features=50  # Extract top 50 features
        )
        
        # Fit and transform the text
        count_data = count_vectorizer.fit_transform([cleaned_text])
        
        # Get the most common terms
        words = count_vectorizer.get_feature_names_out()
        count_values = count_data.toarray().flatten()
        
        # Create a dictionary of term frequencies
        term_frequencies = dict(zip(words, count_values))
        
        # Sort by frequency and add to skills
        sorted_keywords = sorted(term_frequencies.items(), key=lambda x: x[1], reverse=True)
        for keyword, _ in sorted_keywords[:20]:  # Take top 20
            if len(keyword) > 3 and keyword not in [s.lower() for s in skills]:
                skills.append(keyword)
    
    except Exception as e:
        logger.error(f"Error in keyword extraction: {str(e)}")
    
    # 4. Extract education requirements
    education_terms = []
    education_mentioned = False
    education_indicators = ['degree', 'bachelor', 'master', 'phd', 'diploma', 'certification', 'graduated', 'university']
    education_requirement_phrases = ['degree required', 'must have degree', 'education required', 'degree in', 'qualified with']
    
    # First check if any education requirement phrases exist
    if any(phrase in text.lower() for phrase in education_requirement_phrases):
        education_mentioned = True
    
    for sent in doc.sents:
        if any(edu in sent.text.lower() for edu in education_indicators):
            # Found education-related sentence
            education_mentioned = True
            for token in sent:
                if token.text.lower() in education_indicators:
                    # Get the full education requirement phrase
                    phrase = ' '.join([t.text for t in token.subtree])
                    education_terms.append(phrase)
    
    # Find the highest education level mentioned
    education_level = 'none'
    if education_mentioned:
        if any(term for term in education_terms if 'phd' in term.lower() or 'doctor' in term.lower()):
            education_level = 'phd'
        elif any(term for term in education_terms if 'master' in term.lower() or 'msc' in term.lower() or 'ms ' in term.lower()):
            education_level = 'masters'
        elif any(term for term in education_terms if 'bachelor' in term.lower() or 'bs ' in term.lower() or 'ba ' in term.lower()):
            education_level = 'bachelors'
        elif education_terms:  # If other education terms found
            education_level = 'other'
    
    # 5. Extract required languages (human languages, not programming)
    language_entities = [ent.text for ent in doc.ents if ent.label_ == 'LANGUAGE']
    
    # 6. Look for certification requirements
    certification_patterns = [
        r'certification(?:s)? (?:in|required|needed): ([^\.]+)',
        r'certified ([^\.]+)',
        r'require(?:s|d)? ([^\.]+) certification'
    ]
    certifications = []
    for pattern in certification_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        certifications.extend(matches)
    
    # Compile all requirements
    requirements = {
        'skills': list(set(skills)),
        'years_experience': years,
        'education_level': education_level,
        'education_mentioned': education_mentioned,
        'education_terms': education_terms,
        'languages': language_entities,
        'certifications': list(set(certifications)),
        'full_text': text
    }
    
    return requirements

def get_skill_similarity(resume_skills, job_skills):
    """Calculate skill similarity using semantic embeddings and direct matching"""
    if not resume_skills or not job_skills:
        return 0.0
    
    # Direct matches (case-insensitive)
    direct_matches = 0
    matched_resume_skills = []
    
    for js in job_skills:
        best_match = None
        best_score = 0
        
        for rs in resume_skills:
            # Skip if this resume skill already matched with a job skill
            if rs in matched_resume_skills:
                continue
                
            # Exact match or substring match
            if js.lower() == rs.lower():
                score = 1.0
            elif js.lower() in rs.lower() or rs.lower() in js.lower():
                score = 0.8
            else:
                # Check for word-level overlap
                js_words = set(js.lower().split())
                rs_words = set(rs.lower().split())
                if js_words & rs_words:  # If there's an intersection
                    score = len(js_words & rs_words) / len(js_words)
                else:
                    score = 0
            
            if score > best_score:
                best_score = score
                best_match = rs
        
        if best_match and best_score > 0.5:  # Only consider good enough matches
            direct_matches += best_score
            matched_resume_skills.append(best_match)
    
    # Semantic similarity for unmatched skills
    semantic_score = 0
    remaining_resume_skills = [rs for rs in resume_skills if rs not in matched_resume_skills]
    remaining_job_skills = [js for js in job_skills if not any(js.lower() in rs.lower() or rs.lower() in js.lower() for rs in matched_resume_skills)]
    
    # Only calculate semantic score if there are remaining skills and direct matches are not satisfactory
    if remaining_resume_skills and remaining_job_skills and direct_matches < len(job_skills) * 0.7:
        try:
            # Use sentence transformer for semantic matching
            model = get_sentence_transformer()
            resume_embeddings = model.encode(remaining_resume_skills)
            job_embeddings = model.encode(remaining_job_skills)
            
            # Calculate similarity matrix
            sim_matrix = cosine_similarity(resume_embeddings, job_embeddings)
            
            # For each job skill, find best matching resume skill
            best_matches = np.max(sim_matrix, axis=0)
            semantic_score = np.mean(best_matches) * 0.5  # Half weight for semantic matches
        except Exception as e:
            logger.warning(f"Error calculating semantic skill similarity: {e}")
            semantic_score = 0
    
    # Calculate combined score
    combined_score = direct_matches / max(1, len(job_skills))
    if semantic_score > 0:
        combined_score = 0.7 * combined_score + 0.3 * semantic_score
    
    return min(1.0, combined_score)

def get_certification_score(resume_certs, job_description, job_certs=None):
    """Calculate certification relevance score without relying on domain detection"""
    if not resume_certs:
        return 0.0, []
    
    # Filter out empty strings
    resume_certs = [cert for cert in resume_certs if cert and isinstance(cert, str)]
    if not resume_certs:
        return 0.0, []
    
    # If job specifies certifications, do direct matching
    match_reasons = []
    if job_certs:
        cert_matches = []
        for r_cert in resume_certs:
            for j_cert in job_certs:
                if r_cert.lower() == j_cert.lower():
                    cert_matches.append(r_cert)
                    match_reasons.append(f"Has required certification: {r_cert}")
                    break
                    
        if cert_matches:
            return len(cert_matches) / len(job_certs), match_reasons
    
    # If no direct matches or no job certs specified, evaluate relevance using semantic similarity
    try:
        model = get_sentence_transformer()
        cert_embeddings = model.encode(resume_certs)
        job_embedding = model.encode([job_description])
        
        # Calculate similarity between each cert and the job
        similarities = cosine_similarity(cert_embeddings, job_embedding)
        
        # Get best matching certs (above threshold)
        relevant_certs = []
        for i, sim in enumerate(similarities):
            if sim[0] > 0.3:  # Threshold for relevance
                relevant_certs.append(resume_certs[i])
                match_reasons.append(f"Has relevant certification: {resume_certs[i]}")
        
        if relevant_certs:
            return min(0.8, 0.2 * len(relevant_certs)), match_reasons
            
    except Exception as e:
        logger.warning(f"Error calculating certification relevance: {e}")
    
    # Give minimal credit just for having certifications
    return min(0.3, 0.1 * len(resume_certs)), []

def recommend_resumes(job_desc, resumes, top_n=5):
    """Match resumes to job description using NLP and provide match reasons"""
    try:
        start_time = time.time()
        
        # Extract requirements from job description
        job_requirements = extract_keywords_and_requirements(job_desc)
        logger.info(f"Extracted requirements: {job_requirements}")
        
        # Generate job description embedding for semantic matching
        job_embedding = get_sentence_transformer().encode(job_desc)
        
        # Process resumes in parallel
        resumes_to_process = [r for r in resumes if r.get('embedding') is not None and np.size(r['embedding']) > 0]
        scores = []
        
        # Process each resume using optimized scoring
        for resume in resumes_to_process:
            try:
                match_reasons = []
                score_components = {}
                
                # 1. Calculate semantic similarity score
                resume_embedding = np.array(resume['embedding'])
                semantic_score = cosine_similarity([job_embedding], [resume_embedding])[0][0]
                score_components['similarity'] = semantic_score
                
                # 2. Calculate skill match score
                resume_skills = resume.get('skills', [])
                skill_match_score = get_skill_similarity(resume_skills, job_requirements['skills'])
                score_components['skill_match'] = skill_match_score
                
                # Only include specific skill matches in reasons, not the raw score
                for rs in resume_skills:
                    for js in job_requirements['skills']:
                        if js.lower() in rs.lower() or rs.lower() in js.lower():
                            match_reasons.append(f"Has required skill: {rs}")
                            break
                
                # 3. Calculate experience score
                req_years = job_requirements['years_experience']
                candidate_years = calculate_total_experience(resume.get('experience', []))
                
                if req_years > 0 and candidate_years >= req_years:
                    match_reasons.append(f"Has {int(candidate_years)} years of experience (required: {req_years})")
                    experience_score = min(candidate_years / req_years, 1.5)  # Cap at 1.5x
                else:
                    experience_score = min(candidate_years / max(1, req_years), 1.0)
                
                score_components['experience'] = experience_score
                
                # 4. Calculate education score
                candidate_education = get_highest_education(resume.get('education', []))
                edu_score = calculate_education_score(candidate_education, job_requirements['education_level'])
                score_components['education'] = edu_score
                
                # Only add education as a match reason if education was explicitly mentioned
                if job_requirements.get('education_mentioned', False) and edu_score > 0.7:
                    for edu in resume.get('education', []):
                        degree = edu.get('degree', 'degree')
                        institution = edu.get('institution', 'institution')
                        match_reasons.append(f"Has {degree} from {institution}")
                        break
                
                # 5. Calculate certification score
                resume_certs = resume.get('certifications', [])
                job_certs = job_requirements.get('certifications', [])
                cert_score_tuple = get_certification_score(resume_certs, job_desc, job_certs)
                
                # Handle the tuple return value correctly
                if isinstance(cert_score_tuple, tuple):
                    cert_score, cert_reasons = cert_score_tuple
                    match_reasons.extend(cert_reasons)
                else:
                    # Handle the case where a float was returned (backward compatibility)
                    cert_score = cert_score_tuple
                    
                score_components['certifications'] = cert_score
                
                # 6. Calculate language score (handles objects with name/fluency)
                language_score = 0.0
                raw_langs = resume.get('languages', [])
                resume_langs = []
                for item in raw_langs:
                    if isinstance(item, str):
                        resume_langs.append(item)
                    elif isinstance(item, dict):
                        name = item.get('name') or ''
                        if name:
                            resume_langs.append(name)
                job_langs = job_requirements.get('languages', []) or []
                if resume_langs and job_langs:
                    matches = []
                    for r in resume_langs:
                        for j in job_langs:
                            if r.strip().lower() == j.strip().lower():
                                matches.append(r)
                                match_reasons.append(f"Speaks required language: {r}")
                                break
                    language_score = len(matches) / len(job_langs)
                score_components['languages'] = language_score
                
                # Calculate final score with weights
                final_score = sum(WEIGHTS[component] * score for component, score in score_components.items())
                
                # Add match reasons and score to resume
                resume_with_reasons = resume.copy()
                resume_with_reasons['match_reasons'] = match_reasons
                resume_with_reasons['score'] = float(final_score)
                resume_with_reasons['score_components'] = score_components  # Add component scores for transparency
                
                scores.append((resume_with_reasons, final_score))
                
            except Exception as e:
                logger.error(f"Error scoring resume {resume.get('id')}: {str(e)}")
        
        # Sort by score and return top N
        scores.sort(key=lambda x: x[1], reverse=True)
        
        end_time = time.time()
        logger.info(f"Recommendation took {end_time - start_time:.2f} seconds")
        
        return [resume for resume, _ in scores[:top_n]]
    except Exception as e:
        logger.error(f"Error in recommendation: {str(e)}")
        return []

def calculate_total_experience(experiences):
    """Calculate total years of experience from experience entries"""
    total_years = 0
    for exp in experiences:
        # Handle different formats that might exist in the data
        if 'years' in exp:
            try:
                total_years += float(exp.get('years', 0))
            except (ValueError, TypeError):
                pass
        elif 'start_date' in exp:
            try:
                start = datetime.strptime(exp['start_date'], '%Y-%m-%d')
                end = datetime.strptime(exp.get('end_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d')
                total_years += (end - start).days / 365
            except (ValueError, TypeError):
                pass
    return total_years

def get_highest_education(education_entries):
    """Determine highest education level from education entries"""
    highest = 'none'
    for edu in education_entries:
        degree = edu.get('degree', '').lower()
        if 'phd' in degree or 'doctor' in degree:
            return 'phd'  # PhD is highest
        elif ('master' in degree or 'msc' in degree or 'ms ' in degree) and highest != 'phd':
            highest = 'masters'
        elif ('bachelor' in degree or 'bs ' in degree or 'ba ' in degree) and highest not in ['phd', 'masters']:
            highest = 'bachelors'
        elif ('associate' in degree or 'diploma' in degree) and highest not in ['phd', 'masters', 'bachelors']:
            highest = 'associate'
    return highest

def calculate_education_score(candidate_edu, required_edu):
    """Calculate how well candidate's education matches requirements"""
    # Define education levels and their numeric values
    edu_levels = {
        'none': 0,
        'high school': 1,
        'associate': 2, 
        'diploma': 2,
        'bachelors': 3,
        'masters': 4,
        'phd': 5,
        'doctorate': 5
    }
    
    # Default values if not in the dictionary
    candidate_level = edu_levels.get(candidate_edu.lower(), 0)
    required_level = edu_levels.get(required_edu.lower(), 0)
    
    # If no education is required, any education is fine
    if required_level == 0:
        return 1.0
    
    # Calculate score based on whether candidate meets or exceeds requirements
    if candidate_level >= required_level:
        return 1.0
    elif candidate_level > 0:  # Partial credit for some education
        return candidate_level / required_level
    else:
        return 0.0

def preprocess_text(text):
    """Clean and standardize text before embedding"""
    doc = get_nlp()(text.lower())
    tokens = [token.text for token in doc 
             if not token.is_stop and not token.is_punct]
    return " ".join(tokens)

def get_embedding(text):
    """Generate embedding for the given text using lazy-loaded model. Logs execution for debugging."""
    try:
        logger.info(f"Calling get_sentence_transformer() for embedding generation.")
        model = get_sentence_transformer()
        logger.info(f"Model loaded: {model}")
        embedding = model.encode([text])[0]
        logger.info(f"Generated embedding of length {len(embedding)} for text of length {len(text)}.")
        return embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None

def log_recommendation_metrics(job_desc, num_candidates, duration):
    """Log recommendation performance metrics"""
    logger.info({
        'event': 'recommendation',
        'candidates': num_candidates,
        'duration': duration,
        'desc_length': len(job_desc)
    })