#!/usr/bin/env python3
"""
Simple Python test script to verify Python is working in Heroku
"""

import sys
import json
import os

def main():
    """Test Python functionality"""
    try:
        # Test basic Python functionality
        result = {
            "python_version": sys.version,
            "python_executable": sys.executable,
            "working_directory": os.getcwd(),
            "environment_variables": {
                "NODE_ENV": os.environ.get("NODE_ENV", "not_set"),
                "DYNO": os.environ.get("DYNO", "not_set"),
                "PORT": os.environ.get("PORT", "not_set")
            },
            "status": "success",
            "message": "Python is working correctly in Heroku"
        }
        
        print(json.dumps(result, indent=2))
        return 0
        
    except Exception as e:
        error_result = {
            "status": "error",
            "message": f"Python test failed: {str(e)}",
            "python_version": sys.version
        }
        print(json.dumps(error_result, indent=2))
        return 1

if __name__ == "__main__":
    sys.exit(main())













