from http.server import BaseHTTPRequestHandler
import json
import os
from openai import OpenAI

def init_openai():
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    return client

def handler(event, context):
    try:
        # Parse the incoming request body
        body = json.loads(event['body'])
        text = body.get('text', '')
        
        # Initialize OpenAI client
        client = init_openai()
        
        # Make the API call
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates mind maps. Convert the following text into a mind map structure."},
                {"role": "user", "content": text}
            ]
        )
        
        # Extract the response
        result = response.choices[0].message.content
        
        # Return the response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({'result': result})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({'error': str(e)})
        }
