import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.webhook import Webhook
from app.schemas.schemas import WebhookCreate, WebhookUpdate, WebhookOut, WebhookWithSecret
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("", response_model=WebhookWithSecret, status_code=201)
async def create_webhook(
    data: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    webhook = Webhook(
        user_id=current_user.id,
        name=data.name,
        url=str(data.url),
        secret=secrets.token_hex(32),
    )
    db.add(webhook)
    await db.flush()
    await db.refresh(webhook)
    return webhook


@router.get("", response_model=list[WebhookOut])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Webhook).where(Webhook.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{webhook_id}", response_model=WebhookWithSecret)
async def get_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    webhook = await _get_user_webhook(db, webhook_id, current_user.id)
    return webhook


@router.put("/{webhook_id}", response_model=WebhookOut)
async def update_webhook(
    webhook_id: UUID,
    data: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    webhook = await _get_user_webhook(db, webhook_id, current_user.id)

    if data.name is not None:
        webhook.name = data.name
    if data.url is not None:
        webhook.url = str(data.url)
    if data.enabled is not None:
        webhook.enabled = data.enabled

    await db.flush()
    await db.refresh(webhook)
    return webhook


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    webhook = await _get_user_webhook(db, webhook_id, current_user.id)
    await db.delete(webhook)


@router.post("/{webhook_id}/rotate-secret", response_model=WebhookWithSecret)
async def rotate_secret(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    webhook = await _get_user_webhook(db, webhook_id, current_user.id)
    webhook.secret = secrets.token_hex(32)
    await db.flush()
    await db.refresh(webhook)
    return webhook


async def _get_user_webhook(db: AsyncSession, webhook_id: UUID, user_id: UUID) -> Webhook:
    result = await db.execute(
        select(Webhook).where(
            Webhook.id == webhook_id,
            Webhook.user_id == user_id,
        )
    )
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook
