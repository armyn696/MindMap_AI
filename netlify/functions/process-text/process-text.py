import json
import os
import google.generativeai as genai

def init_gemini():
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise Exception("GOOGLE_API_KEY is not set")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-pro')

def handler(event, context):
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        }

    try:
        # Parse the incoming request body
        if not event.get('body'):
            raise Exception("No body in request")
            
        body = json.loads(event['body'])
        text = body.get('text', '')
        
        if not text:
            raise Exception("No text provided")
        
        # Initialize Gemini
        model = init_gemini()
        
        # Make the API call
        prompt = f"""You are a helpful assistant that creates mind maps. Convert the following text into a mind map structure:

{text}"""
        
        response = model.generate_content(prompt)
        
        # Return the response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'result': response.text
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")  # This will show up in Netlify Function logs
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }
