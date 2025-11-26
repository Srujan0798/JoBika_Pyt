"""
JoBika API Documentation Configuration
Swagger/OpenAPI specification
"""

from flasgger import Swagger, swag_from

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "JoBika API",
        "description": "AI-Powered Job Application Platform API",
        "contact": {
            "name": "JoBika Team",
            "url": "https://github.com/Srujan0798/JoBika_Py",
        },
        "version": "1.0.0"
    },
    "host": "localhost:5000",
    "basePath": "/",
    "schemes": [
        "http",
        "https"
    ],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
        }
    },
}

def init_swagger(app):
    """Initialize Swagger documentation"""
    return Swagger(app, config=swagger_config, template=swagger_template)


# API Endpoint Documentation Templates

auth_register_spec = {
    "tags": ["Authentication"],
    "summary": "Register a new user",
    "description": "Create a new user account with email and password",
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "email": {"type": "string", "example": "user@example.com"},
                    "password": {"type": "string", "example": "SecurePass123"},
                    "fullName": {"type": "string", "example": "John Doe"},
                    "phone": {"type": "string", "example": "+1234567890"}
                },
                "required": ["email", "password"]
            }
        }
    ],
    "responses": {
        "201": {
            "description": "User created successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "token": {"type": "string"},
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "email": {"type": "string"},
                            "fullName": {"type": "string"}
                        }
                    }
                }
            }
        },
        "400": {"description": "Invalid input or email already exists"}
    }
}

auth_login_spec = {
    "tags": ["Authentication"],
    "summary": "Login user",
    "description": "Authenticate user and receive JWT token",
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "email": {"type": "string"},
                    "password": {"type": "string"}
                },
                "required": ["email", "password"]
            }
        }
    ],
    "responses": {
        "200": {
            "description": "Login successful",
            "schema": {
                "type": "object",
                "properties": {
                    "token": {"type": "string"},
                    "user": {"type": "object"}
                }
            }
        },
        "401": {"description": "Invalid credentials"}
    }
}

jobs_list_spec = {
    "tags": ["Jobs"],
    "summary": "Get all jobs",
    "description": "Retrieve list of available jobs with optional location filter",
    "parameters": [
        {
            "name": "location",
            "in": "query",
            "type": "string",
            "description": "Filter jobs by location"
        }
    ],
    "responses": {
        "200": {
            "description": "List of jobs",
            "schema": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "title": {"type": "string"},
                        "company": {"type": "string"},
                        "location": {"type": "string"},
                        "salary": {"type": "string"},
                        "skills": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        }
    }
}

resume_upload_spec = {
    "tags": ["Resume"],
    "summary": "Upload resume",
    "description": "Upload and parse PDF or DOCX resume",
    "security": [{"Bearer": []}],
    "consumes": ["multipart/form-data"],
    "parameters": [
        {
            "name": "file",
            "in": "formData",
            "type": "file",
            "required": True,
            "description": "Resume file (PDF or DOCX)"
        }
    ],
    "responses": {
        "200": {
            "description": "Resume uploaded and parsed successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "filename": {"type": "string"},
                    "skills": {"type": "array"},
                    "experienceYears": {"type": "integer"}
                }
            }
        },
        "401": {"description": "Unauthorized"}
    }
}

applications_create_spec = {
    "tags": ["Applications"],
    "summary": "Apply to a job",
    "description": "Submit a job application",
    "security": [{"Bearer": []}],
    "parameters": [
        {
            "name": "body",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "properties": {
                    "jobId": {"type": "integer"}
                },
                "required": ["jobId"]
            }
        }
    ],
    "responses": {
        "201": {
            "description": "Application submitted successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "jobId": {"type": "integer"},
                    "status": {"type": "string"},
                    "matchScore": {"type": "integer"}
                }
            }
        },
        "401": {"description": "Unauthorized"},
        "404": {"description": "Job or resume not found"}
    }
}
