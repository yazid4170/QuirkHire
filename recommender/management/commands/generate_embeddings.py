import os
import django
import logging
from django.core.management.base import BaseCommand
from supabase import create_client
from sentence_transformers import SentenceTransformer
import numpy as np
import base64
from recommender.utils import enhance_resume_embedding

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_recommender.settings')
django.setup()

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Generate embeddings for all resumes in resumes_duplicate table'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without saving changes'
        )

    def handle(self, *args, **options):
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Verify connection
        try:
            test = supabase.table('resumes_duplicate').select('count', count='exact').execute()
            self.stdout.write(f"Connection successful. Table exists with ~{test.count} rows", self.style.SUCCESS)
        except Exception as e:
            self.stderr.write(f"Supabase connection failed: {str(e)}", self.style.ERROR)
            return
        
        model = SentenceTransformer("all-MiniLM-L6-v2")
        dry_run = options['dry_run']

        # Fetch ALL resumes
        res = supabase.table('resumes_duplicate') \
            .select('*') \
            .execute()
            
        resumes = res.data
        self.stdout.write(f"Found {len(resumes)} resumes total")

        for idx, resume in enumerate(resumes):
            try:
                self.stdout.write(f"\nProcessing resume {idx+1}/{len(resumes)} (ID: {resume['id']})")
                
                # Generate enhanced embedding text
                embedding_text = enhance_resume_embedding(resume)
                
                # Generate embedding
                embedding = model.encode(embedding_text).astype(np.float32)
                embedding_bytes = embedding.tobytes()
                embedding_b64 = base64.b64encode(embedding_bytes).decode('utf-8')

                if not dry_run:
                    supabase.table('resumes_duplicate') \
                        .update({'embedding': embedding_b64}) \
                        .eq('id', resume['id']) \
                        .execute()
                    
                    self.stdout.write(f"Updated resume {resume['id']}", self.style.SUCCESS)
                else:
                    self.stdout.write(f"[Dry Run] Would update {resume['id']}", self.style.WARNING)

            except Exception as e:
                logger.error(f"Error processing resume {resume['id']}: {str(e)}")
                self.stderr.write(f"Error: {str(e)}", self.style.ERROR)
                continue

        self.stdout.write("\nEmbedding generation complete!", self.style.SUCCESS) 