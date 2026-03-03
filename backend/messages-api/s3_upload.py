"""Загрузка фотографий на S3."""
import os
import uuid
import base64
import boto3


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def upload_photos_to_s3(photos_base64):
    """Загружает base64-фото на S3 и возвращает CDN-ссылки."""
    if not photos_base64:
        return []
    s3 = get_s3()
    key_id = os.environ['AWS_ACCESS_KEY_ID']
    urls = []
    for item in photos_base64:
        if isinstance(item, str) and item.startswith('http'):
            urls.append(item)
            continue
        if isinstance(item, dict):
            data_b64 = item.get('data', '')
            content_type = item.get('type', 'image/jpeg')
        elif isinstance(item, str) and ',' in item:
            header, data_b64 = item.split(',', 1)
            content_type = header.split(':')[1].split(';')[0] if ':' in header else 'image/jpeg'
        else:
            continue
        ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
        file_key = f"chat-photos/{uuid.uuid4().hex}.{ext}"
        s3.put_object(
            Bucket='files',
            Key=file_key,
            Body=base64.b64decode(data_b64),
            ContentType=content_type,
        )
        urls.append(f"https://cdn.poehali.dev/projects/{key_id}/bucket/{file_key}")
    return urls
