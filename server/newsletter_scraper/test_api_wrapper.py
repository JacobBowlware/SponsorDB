#!/usr/bin/env python3
"""
Simple test API wrapper that returns success without processing emails
"""

import sys
import json
from datetime import datetime

def main():
    """Simple test that returns success"""
    try:
        # Don't print debug messages to stdout - only JSON output
        # print("Starting simple test scraper...")
        
        # Simulate some work
        import time
        time.sleep(2)  # Wait 2 seconds to simulate work
        
        result = {
            'success': True,
            'message': 'Test scraper completed successfully (no emails processed)',
            'duration_seconds': 2.0,
            'stats': {
                'emails_processed': 0,
                'sponsors_found': 0,
                'errors': 0
            },
            'timestamp': datetime.now().isoformat()
        }
        
        print(json.dumps(result, indent=2))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'success': False,
            'message': f'Test scraper failed: {str(e)}',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
