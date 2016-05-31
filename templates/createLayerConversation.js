{
    "participants": "{{ conversation.participants }}",
    "distinct": true,
    "metadata": {
        "type":"fb-conversation",
        "state":"active",
        "user":{
            "id": "{{ conversation.user.id }}",
            "nickname": "{{ conversation.user.nickname }}",
            "name": "{{ conversation.user.name }}",
            "pic":  "{{ conversation.user.pic }}",
            "gender":  "{{ conversation.user.gender }}",
        },
        "store":{
            "name":  "FB - { conversation.user.name }}"
        }
    }
}
