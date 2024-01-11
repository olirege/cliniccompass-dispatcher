from firebase_functions import https_fn, firestore_fn
from firebase_admin import initialize_app, auth, firestore
import google.cloud.firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import dotenv
from agora_token_builder import RtcTokenBuilder
import os
import time
initialize_app()

@https_fn.on_call()
def set_employee_role(req: https_fn.CallableRequest):
    print("set employee role")
    uid = req.auth.uid
    print(uid)
    if uid is None:
        print("no uid")
        return { "status":400 }
    firestore_client = google.cloud.firestore.Client = firestore.client()
    invite_query = firestore_client.collection('invites').where(filter=FieldFilter('usedBy', "==", uid)).limit(1)
    print('query', invite_query)
    invites = invite_query.stream()
    print('invites', invites)
    invite_ref = None
    for invite in invites:
        invite_ref = invite.reference
        break
    if invite_ref is None:
        print("no invite")
        return {"status":404, "response":'User not invited'}
    try:
        print("setting claims")
        auth.set_custom_user_claims(uid, {'role': 'employee'})
        print("updating invite")
        return {"status":200, "response":'User is employee'}
    except:
        print("failed to set claims")
        return {"status":400, "response":'Failed to set claims'}

@https_fn.on_call()
def employee_accept_calls(req: https_fn.CallableRequest):
    print("employee accept calls")
    uid = req.auth.uid
    print(uid)
    if uid is None:
        print("no uid")
        return { "status": 400 }
    firestore_client = google.cloud.firestore.Client = firestore.client()
    # check claims for role employee
    claims = auth.get_user(uid).custom_claims
    print(claims)
    if claims is None or claims['role'] != 'employee':
        print("not employee")
        return { "status": 401 }
    # check if employee is already accepting calls
    employee_ref = firestore_client.collection('employeesOnline').document(uid)
    employee_doc = employee_ref.get()
    if employee_doc.exists:
        print("employee already accepting calls")
        return { "status": 409 }
    # add employee to employeesOnline
    employee_ref.set({'id': uid, 'busy': False, 'jobCount': 0})
    print("employee added to employeesOnline")
    return { "status": 200 }

@https_fn.on_call()
def employee_reject_calls(req: https_fn.CallableRequest):
    print("employee reject calls")
    uid = req.auth.uid
    print(uid)
    if uid is None:
        print("no uid")
        return { "status": 400 }
    firestore_client = google.cloud.firestore.Client = firestore.client()
    # check claims for role employee
    claims = auth.get_user(uid).custom_claims
    print(claims)
    if claims is None or claims['role'] != 'employee':
        print("not employee")
        return { "status": 401 }
    # check if employee is already accepting calls
    employee_ref = firestore_client.collection('employeesOnline').document(uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        print("employee not accepting calls")
        return { "status": 409 }
    # remove employee from employeesOnline
    employee_ref.delete()
    print("employee removed from employeesOnline")
    return { "status": 200 }

def string_to_ascii_numbers(input_string):
    n = [ord(char) for char in input_string]
    sum = 0
    for i in n:
        sum += i
    return sum

def initialize_agora_video_call(client, employee_id, job_id):
    # create a channel in agora
    # create a token for the channel
    # send the token to the user
    print("initialize agora video call")
    agora_app_id = client.collection('agoraAppId').document('agoraAppId').get().to_dict()['agoraAppId']
    agora_app_cert = client.collection('agoraAppId').document('agoraAppCert').get().to_dict()['agoraAppCert']
    # timestamp in seconds 10 minutes from now
    privilegeExpiredTs = int(time.time()) + 600
    ascii_numbers = string_to_ascii_numbers(employee_id)
    host_token = RtcTokenBuilder.buildTokenWithUid(agora_app_id, agora_app_cert, job_id, ascii_numbers, 1, privilegeExpiredTs)
    user_token = RtcTokenBuilder.buildTokenWithUid(agora_app_id, agora_app_cert, job_id, 0, 0, privilegeExpiredTs)
    return {"type": "video", "user_token": user_token, "host_token": host_token, "channel": job_id, "appId": agora_app_id, "employee_id": ascii_numbers }
def initialize_chat(client, employee_id, job_id, user_id):
    # add doc to /chats/{id}
    data = {'user_id': user_id, 'channel': job_id, 'employee_id': employee_id, 'created_at': firestore.SERVER_TIMESTAMP}
    client.collection('chats').document(job_id).set(data)
    return {"channel": job_id, "employee_id": employee_id, "user_id": user_id, "type": "chat"}
@https_fn.on_call()
def employee_accepts_call(req: https_fn.CallableRequest):
    print("employee accepts call")
    uid = req.auth.uid
    print(uid)
    if uid is None:
        print("no uid")
        return { "status": 400 }
    if req.data is None:
        print("no data")
        return { "status": 400 }
    firestore_client = google.cloud.firestore.Client = firestore.client()
    # check claims for role employee
    claims = auth.get_user(uid).custom_claims
    print(claims)
    if claims is None or claims['role'] != 'employee':
        print("not employee")
        return { "status": 401 }
    # check if employee is accepting calls
    employee_ref = firestore_client.collection('employeesOnline').document(uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        print("employee not accepting calls")
        return { "status": 409 }
    # check if employee is already on a call
    employee_doc = employee_doc.to_dict()
    if employee_doc['busy']:
        print("employee already on a call")
        return { "status": 409 }
    job_to_awnser = req.data
    print(job_to_awnser)
    # set employee to busy
    employee_ref.update({'busy': True, 'jobId': job_to_awnser['id']})
    employee_id = employee_doc['id']
    user_id = job_to_awnser['uid']
    # set job to accepted
    context = None
    join_request_ref = firestore_client.collection('joinRequests').document(job_to_awnser['id'])
    if(job_to_awnser['type'] == "video"):
        context = initialize_agora_video_call(firestore_client,employee_id, job_to_awnser['id'])
        # set joinRequest to accepted with context
        join_request_ref.update({'status': "accepted", 'context': { 'type': context['type'], "token": context['user_token'], "channel": context['channel'], "appId": context['appId'], "employee_id": context['employee_id'] }})
    if(job_to_awnser['type'] == "chat"):
        context = initialize_chat(firestore_client, employee_id, job_to_awnser['id'], user_id)
        join_request_ref.update({'status': "accepted", 'context': { 'type': context['type'], "channel": context['channel'], "user_id": context['user_id'] }})
    print("context", context)
    job_ref = firestore_client.collection_group('jobs').where(filter=FieldFilter('id', "==", job_to_awnser['id']))
    jobs = job_ref.stream()
    for job in jobs:
        job_ref = job.reference
        job_ref.update({'status': "accepted"})
        break
    print("employee set to busy")
    print("join request set to accepted")
    return { "status": 200, "context": context }

@https_fn.on_call()
def employee_ends_call(req: https_fn.CallableRequest):
    print("employee ends call")
    uid = req.auth.uid
    print(uid)
    if uid is None:
        print("no uid")
        return { "status": 400 }
    firestore_client = google.cloud.firestore.Client = firestore.client()
    # check claims for role employee
    claims = auth.get_user(uid).custom_claims
    print(claims)
    if claims is None or claims['role'] != 'employee':
        print("not employee")
        return { "status": 401 }
    # check if employee is accepting calls
    employee_ref = firestore_client.collection('employeesOnline').document(uid)
    employee_doc = employee_ref.get()
    if not employee_doc.exists:
        print("employee not accepting calls")
        return { "status": 409 }
    # check if employee is on a call
    employee_doc = employee_doc.to_dict()
    if not employee_doc['busy']:
        print("employee not on a call")
        return { "status": 409 }
    # set employee to not busy
    employee_ref.update({'busy': False, 'jobId': None})
    # set job to ended
    job_ref = firestore_client.collection_group('jobs').where(filter=FieldFilter('id', "==", employee_doc['jobId']))
    jobs = job_ref.stream()
    for job in jobs:
        job_ref = job.reference
        job_ref.update({'status': "ended"})
        break
    print("employee set to not busy")
    print("job set to ended")
    return { "status": 200 }
@firestore_fn.on_document_created(document="joinRequests/{requestId}")
def user_join_request_handler(event = firestore_fn.Event) -> None:
    # assign to queues/{employeeId}/jobs/{requestId}
    # assign to employee with the least of amount of jobs
    request_id = event.params['requestId']
    join_request_snapshot = event.data
    join_request_data = join_request_snapshot.to_dict()
    print("request_data", join_request_data)
    firestore_client = google.cloud.firestore.Client = firestore.client()
    employees_online_ref = firestore_client.collection('employeesOnline')
    employees_online = employees_online_ref.stream()
    employee_with_least_jobs_count = None
    employee_with_least_jobs = None
    for employee in employees_online:
        employee_data = employee.to_dict()
        if employee_with_least_jobs_count is None or employee_data['jobCount'] < employee_with_least_jobs_count:
            employee_with_least_jobs_count = employee_data['jobCount']
            employee_with_least_jobs = employee_data
    if employee_with_least_jobs is None:
        return
    print("employee_with_least_jobs", employee_with_least_jobs)
    employee_queue_ref = firestore_client.collection('queues').document(employee_with_least_jobs['id'])
    employee_queue_jobs_ref = employee_queue_ref.collection('jobs')
    print("employee_queue_jobs_ref", employee_queue_jobs_ref)
    print("request_id", request_id)
    join_request_data['parentId'] = employee_with_least_jobs['id']
    employee_queue_jobs_ref.document(request_id).set(join_request_data)
    employee_with_least_jobs['jobCount'] += 1
    employees_online_ref.document(employee_with_least_jobs['id']).set(employee_with_least_jobs)
    


@firestore_fn.on_document_deleted(document="joinRequests/{requestId}")
def user_cancel_request_handler(event = firestore_fn.Event) -> None:
    request_id = event.params['requestId']
    join_request_snapshot = event.data
    join_request_data = join_request_snapshot.to_dict()
    print("request_data", join_request_data)
    firestore_client = google.cloud.firestore.Client = firestore.client()
    jobs_ref = firestore_client.collection_group('jobs').where(filter=FieldFilter('id', "==", request_id))
    jobs = jobs_ref.stream()
    parentId = None
    for job in jobs:
        job_ref = job.reference
        job_data = job.to_dict()
        parentId = job_data['parentId']
        job_ref.delete()
    employees_online_ref = firestore_client.collection('employeesOnline')
    employees_online = employees_online_ref.stream()
    for employee in employees_online:
        employee_data = employee.to_dict()
        if employee_data['id'] == parentId:
            employee_data['jobCount'] -= 1
            employees_online_ref.document(employee_data['id']).set(employee_data)
            break
    return