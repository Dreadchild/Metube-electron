export default {
  methods: {
    /**
     * 공통 CreateIndex
     *
     * @param {*} fieldToArray - 색인필드
     */
    createIndex(fieldToArray) {
      return this.$test.createIndex({
        index: {
          fields: fieldToArray
        }
      })
    },

    /**
     * 내 컬렉션 하위에 속해있는 데이터(비디오)셋을 조회
     *
     * @param {*} _id - 선택한 컬렉션의 아이디
     */
    getSubsetMusic(_id) {
      return this.createIndex(["userId", "parentId"]).then(() => {
        return this.$test.find({
          selector: {
            userId: {
              $eq: this.getUserId()
            },
            parentId: {
              $eq: _id
            }
          },
          limit: 100
        })
      })
    },

    getRemoteProfile() {
      return this.$test
        .find({
          selector: {
            type: "profile",
            userId: this.getUserId()
          }
        })
        .then(result => {
          return result.docs[0]
        })
    },

    setRemoteSubsetMusicData(payload, data, flag) {
      this.$test
        .find({
          selector: {
            type: "profile",
            userId: this.getUserId()
          }
        })
        .then(result => {
          if (result) {
            // 스토어 디비 데이터셋
            let doc = result.docs[0]
            let collections = doc.collections
            // 실제 db 데이터셋
            const myMusicData = {
              list: payload,
              listCount: payload.length,
              id: payload[0].parentId // 모든 데이터에는 부모 아이디가 있으므로 1개만 선택한다.
            }
            if (collections.length <= 0) {
              collections.push(myMusicData)
              this.updateProfile(doc)
            } else {
              const findData = this.$lodash.find(collections, { id: myMusicData.id })
              if (!findData) {
                collections.push(myMusicData)
                this.updateProfile(doc)
              } else {
                if (findData.listCount != myMusicData.listCount) {
                  const findDataIndex = this.$lodash.findIndex(collections, {
                    id: myMusicData.id
                  })
                  if (!data) {
                    // 추가 했을때 비디오 아이디를 가지고 있으면, 추가한것만 기존 스토어에 추가한다.
                    // 스토어 DB와, DOC DB 목록에서 중복을 제외한
                    // let insertVideoData = myMusicData.list.slice(-1).pop();
                    // collections[findDataIndex].list.push(insertVideoData)
                    // collections[findDataIndex].listCount = collections[findDataIndex].list.length
                  } else {
                    // TODO: DB에서 실제 삭제된 항목을 DB 스토어내 재생목록에 속한 비디오를 찾아서 제거한다.
                    findData.list = this.$lodash.reject(findData.list, {
                      videoId: data.deletedVideoId
                    })
                    findData.listCount = findData.list.length
                    collections[findDataIndex] = findData
                  }


                  console.log(doc)
                  this.updateProfileAndListSync(doc, myMusicData.id, flag)
                }
              }
            }
          }
        })
    },

    // 프로필 갱신
    updateProfile(doc) {
      this.$test.put(doc).then(res => {
        if (res.ok) {
          console.log("put success!")
        }
      })
    },

    // DB 스토어 갱신 후 목록 동기화
    updateProfileAndListSync(doc, parentId, ev) {
      this.$test.put(doc).then(res => {
        if (res.ok) {
          this.getRemoteProfile().then(result => {
            if (result.collections) {
              const list = result.collections
              if (list) {
                // 스토어에 저장된 재생목록을 찾는다.
                const findData = this.$lodash.find(list, {
                  id: parentId
                })

                // 찾은 목록을 랜더링한다.
                if (findData) {
                  this.playlist = findData.list
                  this.totalTracks = findData.listCount
                }

                let musicInfo = this.getMusicInfos()
                if (musicInfo) {
                  if (ev === "p") {
                    this.cover = musicInfo.thumbnails
                    this.coverTitle = musicInfo.title
                    this.channelTitle = musicInfo.channelTitle
                    this.selectedIndex = musicInfo.index
                    this.videoActive()
                  }
                }
              }
            }
          })
        }
      })
    }
  }
}
