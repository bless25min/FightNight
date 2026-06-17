import { motion } from 'framer-motion'
import { SectionWrapper } from '../ui/SectionWrapper'

const officialAppointmentAssetBaseUrl = 'https://www.ufcgym.com.tw'

const officialCourseProofGroups = [
  [
    {
      title: '頂級多功能訓練設施',
      image:
        '/assets/classintro/g1-1-f3ebc21d6f114c608cfd8ad470e828189791a84fc8f06890a3a46c3ec41acb51.JPG',
    },
    {
      title: 'D.U.T.每日終極訓練',
      image:
        '/assets/classintro/g1-2-094a03a8699a4097625d03986ad420c4e2fc025700700cc0da9f3942671d7731.jpg',
    },
    {
      title: '互動式團體課程',
      image:
        '/assets/classintro/g1-3-d0dfb84cdecddebf09137a4c075d684b6c3c112f48ff8ad081e703b2234b0c43.jpg',
    },
  ],
  [
    {
      title: '拳擊沙包/TRX 複合設施',
      image:
        '/assets/classintro/g2-12-45045fbb37bbed6ef7c2241c73f401e667bfc06510be0cba9affb6f92bc71b9d.jpg',
    },
    {
      title: '格鬥運動課程',
      image:
        '/assets/classintro/g2-2-eb53c27803353c9a31065967160d6156c77d938a3108b72f96eace419b69b341.jpg',
    },
    {
      title: '踢拳體適能',
      image:
        '/assets/classintro/g2-3-cd3d8c0576fd93ca25f5b472096d8df042b4b607dbb09dc45133e583a834bdf6.jpg',
    },
  ],
  [
    {
      title: '獨立有氧教室空間',
      image:
        '/assets/classintro/g3-1-b38f3a6e9939604e20e679ea6f7085a6337d1b28578b9c8fc3223fadfa5f2ca3.jpg',
    },
    {
      title: '舞蹈課程',
      image:
        '/assets/classintro/g3-2-0c62175c22068419501f7fc17b2ad6392d8a60e0e3e0e3f93db5f05da6c7534b.jpg',
    },
    {
      title: '瑜珈及伸展課程',
      image:
        '/assets/classintro/g3-3-0ad2befa0aaf82c2da0ad9bdcd5d197843373e3addc9c72dd9e6b629c728c030.jpg',
    },
  ],
  [
    {
      title: '一對一私人課程',
      image:
        '/assets/classintro/g4-3-71cd9cc7b6ba6a798b6d3d8bbb86a152cef06acdfaf1aeecafe3b1b63cea9c5c.JPG',
    },
    {
      title: '重量訓練',
      image:
        '/assets/classintro/classintro-img11-da2e434906a3d1338216c58561b335123616eeb072fd80e1ed39d9e80aa347da.jpg',
    },
    {
      title: '頂級 Life Fitness 重訓及有氧設備',
      image:
        '/assets/classintro/classintro-img10-d00bd5fcd2c0bf1c4e0bd385d3ab34a1c54c4fc9a5c4188c3c29d65844cde0b7.jpg',
    },
  ],
  [
    {
      title: '巴西柔術',
      image:
        '/assets/classintro/g5-3-b33ba6a0ce8735f3f5c746f060cd3365636cb472cfcc4bd95569edcc8f96a650.jpg',
    },
    {
      title: '兒童課程',
      image:
        '/assets/classintro/classintro-img14-f1c0afb82dd1a6f7c372c25f3c4f4e3eb0cacb734f58bfd37aa99b24d90b6776.jpg',
    },
    {
      title: '舒適軟墊運動空間',
      image:
        '/assets/classintro/g5-1-edc2ccbd846796fd7ec1b3f364131e4ec6160bba945a189936b4eb84e5bd9dee.JPG',
    },
  ],
  [
    {
      title: '賽事等級八角鐵籠擂臺',
      image:
        '/assets/classintro/g6-1-f242199fc7418e30564f52afe00d1486bd55a9fd5293a4558dd04a83ae721608.jpg',
    },
    {
      title: '進階格鬥課程',
      image:
        '/assets/classintro/g6-2-48dccf202e2010c74d32b1106d8e4281544de14f855c33ba758c9a5a4dcd46ec.JPG',
    },
    {
      title: '一對一私人課程',
      image:
        '/assets/classintro/g6-3-3a7f1d3a978600c8a6f00e8b921031b8071e1af1364930ef4c5a1fa95304f03a.jpg',
    },
  ],
] as const

function officialAssetUrl(path: string) {
  return `${officialAppointmentAssetBaseUrl}${path}`
}

export function OfficialAppointmentProofSection() {
  return (
    <SectionWrapper
      id="official-appointment-proof"
      fullWidth
      padding="py-8"
      className="px-4 lg:px-6"
    >
      <div className="mx-auto max-w-[430px] lg:max-w-[1120px]">
        <div className="mb-4 border-y border-pearl/10 py-4 lg:mb-6 lg:grid lg:grid-cols-[0.78fr_1fr] lg:items-end lg:gap-8 lg:py-6">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-blaze/90">
            UFC GYM TAIWAN
          </p>
          <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl lg:mt-0 lg:text-5xl">
            超越你對健身房的想像
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          {officialCourseProofGroups.map((group, groupIndex) => {
            const [featured, ...secondaryItems] = group

            return (
              <motion.div
                key={featured.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.42, delay: groupIndex * 0.04 }}
                className="grid gap-3"
              >
                <figure className="overflow-hidden rounded-2xl border border-pearl/10 bg-black/35">
                  <div className="relative">
                    <img
                      src={officialAssetUrl(featured.image)}
                      alt={featured.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover lg:aspect-[16/9]"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-4 pt-12">
                      <p className="font-heading text-lg font-black leading-tight text-pearl">
                        {featured.title}
                      </p>
                    </figcaption>
                  </div>
                </figure>

                <div className="grid grid-cols-2 gap-3">
                  {secondaryItems.map((item) => (
                    <figure
                      key={`${featured.title}-${item.title}`}
                      className="overflow-hidden rounded-2xl border border-pearl/10 bg-pearl/[0.035]"
                    >
                      <img
                        src={officialAssetUrl(item.image)}
                        alt={item.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover lg:aspect-[16/10]"
                      />
                      <figcaption className="p-3">
                        <p className="font-heading text-xs font-black leading-snug text-pearl">
                          {item.title}
                        </p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-4 overflow-hidden rounded-2xl border border-pearl/10 bg-black/35"
        >
          <img
            src={officialAssetUrl(
              '/assets/preorder/professional-team-15f78ccd75491e88e5a6d39318d7cce9bf43fef3473a3ac9556e73a3cb646f33.jpg',
            )}
            alt="UFC GYM Taiwan 專業國際化團隊"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover lg:aspect-[21/8]"
          />
          <figcaption className="border-t border-pearl/10 p-4 lg:grid lg:grid-cols-[0.35fr_1fr] lg:items-center lg:gap-5 lg:p-6">
            <p className="font-heading text-lg font-black text-pearl lg:text-2xl">
              專業國際化團隊
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist/70 lg:mt-0 lg:text-base">
              來自各國各領域的專家打造頂級運動娛樂體驗。
            </p>
          </figcaption>
        </motion.figure>
      </div>
    </SectionWrapper>
  )
}
