"""
Utilities for extracting text from PDF resumes
"""

import os
import tempfile
import logging
from PyPDF2 import PdfReader

logger = logging.getLogger('recommender')

def extract_text_from_pdf(pdf_file):
    """
    Extract text from a PDF file
    
    Args:
        pdf_file: Django file object (InMemoryUploadedFile)
    
    Returns:
        str: Extracted text from PDF
    """
    try:
        # Create a temporary file to handle the PDF
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            for chunk in pdf_file.chunks():
                temp_file.write(chunk)
            temp_filename = temp_file.name
        
        # Extract text from the PDF
        extracted_text = ""
        with open(temp_filename, 'rb') as f:
            pdf = PdfReader(f)
            for page_num in range(len(pdf.pages)):
                page = pdf.pages[page_num]
                extracted_text += page.extract_text()
        
        # Clean up temporary file
        os.unlink(temp_filename)
        
        return extracted_text
    
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise e
