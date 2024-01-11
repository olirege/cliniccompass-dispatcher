from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
import google.cloud.firestore
from google.cloud.firestore_v1.base_query import FieldFilter


initialize_app()

@https_fn.on_call()
def set_employee_role(req: https_fn.CallableRequest):
    print("set employee role")
    uid = req.auth.uid
    if uid is None:
        return https_fn.Response(status=400)
    firestore_client = google.cloud.firestore.Client = firestore.client()
    invite_query = firestore_client.collection('invites').where(filter=FieldFilter('usedBy', "==", uid)).limit(1)
    invites = invite_query.stream()
    invite_ref = None
    for invite in invites:
        invite_ref = invite.reference
        break
    if invite_ref is None:
        return https_fn.Response(status=404, response='User not invited')
    try:
        auth.set_custom_user_claims(uid, {'role': 'employee'})
        return https_fn.Response(status=200, response='User is employee')
    except:
        return https_fn.Response(status=400, response='Failed to set claims')